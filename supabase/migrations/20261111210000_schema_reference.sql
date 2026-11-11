/*
  # Schéma de référence de la base Lambretta (état du 11/11/2026)

  Reconstruit tout ce que le site attend dans une base Supabase neuve :
  - les 15 tables du schéma public, leurs index, clés, déclencheur et séquence ;
  - les fonctions (is_admin, like_status, toggle_like, likes_summary,
    update_updated_at_column, rls_auto_enable) ;
  - les 50 règles d'accès (RLS) et les droits des rôles anon / authenticated ;
  - la protection automatique (RLS) de toute nouvelle table (déclencheur ensure_rls) ;
  - les espaces de stockage media et inventory-photos et leurs règles d'accès.

  Généré depuis la base en service (pg_dump --schema-only --schema=public),
  puis complété pour le stockage. Les droits par défaut que Supabase pose
  lui-même sur tout projet (ALTER DEFAULT PRIVILEGES) ont été retirés.
  Les migrations plus anciennes, issues de Bolt et incomplètes (plusieurs tables
  avaient été créées à la main), sont archivées dans supabase/archives/.

  Ne contient AUCUNE donnée : pour les données, voir les sauvegardes (README).
*/

BEGIN;
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$;


--
-- Name: like_status(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.like_status(p_publication_id uuid, p_fingerprint text) RETURNS TABLE(likes_count bigint, is_liked boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT
    (SELECT count(*) FROM public.likes WHERE publication_id = p_publication_id),
    EXISTS (
      SELECT 1 FROM public.likes
      WHERE publication_id = p_publication_id AND user_fingerprint = p_fingerprint
    );
$$;


--
-- Name: likes_summary(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.likes_summary(p_fingerprint text) RETURNS TABLE(publication_id uuid, likes_count bigint, is_liked boolean)
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT l.publication_id,
         count(*) AS likes_count,
         bool_or(l.user_fingerprint = p_fingerprint) AS is_liked
  FROM public.likes l
  GROUP BY l.publication_id;
$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: toggle_like(uuid, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.toggle_like(p_publication_id uuid, p_fingerprint text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF p_fingerprint IS NULL OR char_length(p_fingerprint) NOT BETWEEN 10 AND 100 THEN
    RAISE EXCEPTION 'Identifiant visiteur invalide';
  END IF;

  DELETE FROM public.likes
  WHERE publication_id = p_publication_id AND user_fingerprint = p_fingerprint;

  IF FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.likes (publication_id, user_fingerprint)
  VALUES (p_publication_id, p_fingerprint);
  RETURN true;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: administrative_charges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.administrative_charges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    charge_type text NOT NULL,
    description text NOT NULL,
    amount numeric NOT NULL,
    date_charge date NOT NULL,
    notes text,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT administrative_charges_amount_check CHECK ((amount > (0)::numeric)),
    CONSTRAINT administrative_charges_charge_type_check CHECK ((charge_type = ANY (ARRAY['FFVE'::text, 'ANTS'::text, 'immatriculation'::text, 'assurance'::text, 'autre'::text])))
);


--
-- Name: base_purchase; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.base_purchase (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    vehicle_name text NOT NULL,
    purchase_price numeric(10,2) NOT NULL,
    purchase_date date NOT NULL,
    seller_name text,
    seller_location text,
    vehicle_condition text,
    notes text,
    user_id uuid NOT NULL
);


--
-- Name: before_after; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.before_after (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    title text NOT NULL,
    description text DEFAULT ''::text,
    before_url text NOT NULL,
    after_url text NOT NULL,
    user_id uuid
);


--
-- Name: comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    publication_id uuid NOT NULL,
    author_name text NOT NULL,
    author_email text,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_approved boolean DEFAULT true
);


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    title text NOT NULL,
    category text NOT NULL,
    url text NOT NULL,
    description text DEFAULT ''::text,
    user_id uuid,
    CONSTRAINT documents_category_check CHECK ((category = ANY (ARRAY['facture'::text, 'doc_administratif'::text])))
);


--
-- Name: inventory_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    part_id uuid NOT NULL,
    author_name text NOT NULL,
    author_email text,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    is_approved boolean DEFAULT true
);


--
-- Name: keep_alive; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.keep_alive (
    id integer NOT NULL,
    pinged_at timestamp without time zone DEFAULT now()
);


--
-- Name: keep_alive_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.keep_alive_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: keep_alive_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.keep_alive_id_seq OWNED BY public.keep_alive.id;


--
-- Name: likes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    publication_id uuid NOT NULL,
    user_fingerprint text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: owner_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.owner_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_name text NOT NULL,
    owner_location text,
    start_year integer NOT NULL,
    end_year integer,
    description text,
    is_current boolean DEFAULT false,
    order_index integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: pieces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pieces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    nom text NOT NULL,
    categorie text NOT NULL,
    etat text NOT NULL,
    prix numeric(10,2) NOT NULL,
    fournisseur text,
    date_achat date NOT NULL,
    date_installation date,
    notes text,
    user_id uuid NOT NULL,
    inventory_part_id uuid,
    CONSTRAINT pieces_etat_check CHECK ((etat = ANY (ARRAY['neuve'::text, 'occasion'::text])))
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    is_admin boolean DEFAULT false
);


--
-- Name: publications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.publications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    media_url text NOT NULL,
    media_type text NOT NULL,
    commentaire text NOT NULL,
    user_id uuid,
    CONSTRAINT publications_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text, 'youtube'::text])))
);


--
-- Name: scooter_parts_inventory; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.scooter_parts_inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nom text NOT NULL,
    categorie text NOT NULL,
    etat_actuel text NOT NULL,
    action_prevue text NOT NULL,
    priorite text DEFAULT 'moyenne'::text NOT NULL,
    est_commande boolean DEFAULT false,
    prix_estime numeric,
    fournisseur_prevu text,
    reference text,
    notes text,
    photos text[],
    date_demontage date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL,
    piece_commandee_id uuid,
    CONSTRAINT scooter_parts_inventory_action_prevue_check CHECK ((action_prevue = ANY (ARRAY['commander'::text, 'remplacer'::text, 'rénover'::text, 'nettoyer'::text, 'rien'::text]))),
    CONSTRAINT scooter_parts_inventory_etat_actuel_check CHECK ((etat_actuel = ANY (ARRAY['bon'::text, 'usé'::text, 'cassé'::text, 'manquant'::text, 'à_vérifier'::text]))),
    CONSTRAINT scooter_parts_inventory_priorite_check CHECK ((priorite = ANY (ARRAY['haute'::text, 'moyenne'::text, 'basse'::text])))
);


--
-- Name: time_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.time_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date date NOT NULL,
    start_time time without time zone,
    end_time time without time zone,
    duration_minutes integer NOT NULL,
    task_description text NOT NULL,
    category text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: vehicle_info; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_info (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    engine_serial_number text,
    chassis_number text,
    registration text,
    manufacturing_year integer,
    manufacturing_location text,
    current_state text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: keep_alive id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keep_alive ALTER COLUMN id SET DEFAULT nextval('public.keep_alive_id_seq'::regclass);


--
-- Name: administrative_charges administrative_charges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administrative_charges
    ADD CONSTRAINT administrative_charges_pkey PRIMARY KEY (id);


--
-- Name: base_purchase base_purchase_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.base_purchase
    ADD CONSTRAINT base_purchase_pkey PRIMARY KEY (id);


--
-- Name: before_after before_after_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.before_after
    ADD CONSTRAINT before_after_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: inventory_comments inventory_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_comments
    ADD CONSTRAINT inventory_comments_pkey PRIMARY KEY (id);


--
-- Name: keep_alive keep_alive_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.keep_alive
    ADD CONSTRAINT keep_alive_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: likes likes_publication_id_user_fingerprint_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_publication_id_user_fingerprint_key UNIQUE (publication_id, user_fingerprint);


--
-- Name: owner_history owner_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.owner_history
    ADD CONSTRAINT owner_history_pkey PRIMARY KEY (id);


--
-- Name: pieces pieces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pieces
    ADD CONSTRAINT pieces_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: publications publications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT publications_pkey PRIMARY KEY (id);


--
-- Name: scooter_parts_inventory scooter_parts_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scooter_parts_inventory
    ADD CONSTRAINT scooter_parts_inventory_pkey PRIMARY KEY (id);


--
-- Name: time_entries time_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.time_entries
    ADD CONSTRAINT time_entries_pkey PRIMARY KEY (id);


--
-- Name: vehicle_info vehicle_info_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_info
    ADD CONSTRAINT vehicle_info_pkey PRIMARY KEY (id);


--
-- Name: base_purchase_purchase_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX base_purchase_purchase_date_idx ON public.base_purchase USING btree (purchase_date DESC);


--
-- Name: base_purchase_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX base_purchase_user_id_idx ON public.base_purchase USING btree (user_id);


--
-- Name: before_after_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX before_after_created_at_idx ON public.before_after USING btree (created_at DESC);


--
-- Name: comments_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_created_at_idx ON public.comments USING btree (created_at DESC);


--
-- Name: comments_publication_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX comments_publication_id_idx ON public.comments USING btree (publication_id);


--
-- Name: documents_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_category_idx ON public.documents USING btree (category);


--
-- Name: documents_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX documents_created_at_idx ON public.documents USING btree (created_at DESC);


--
-- Name: idx_administrative_charges_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_administrative_charges_date ON public.administrative_charges USING btree (date_charge);


--
-- Name: idx_administrative_charges_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_administrative_charges_user_id ON public.administrative_charges USING btree (user_id);


--
-- Name: inventory_comments_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inventory_comments_created_at_idx ON public.inventory_comments USING btree (created_at DESC);


--
-- Name: inventory_comments_part_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX inventory_comments_part_id_idx ON public.inventory_comments USING btree (part_id);


--
-- Name: likes_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX likes_created_at_idx ON public.likes USING btree (created_at DESC);


--
-- Name: likes_publication_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX likes_publication_id_idx ON public.likes USING btree (publication_id);


--
-- Name: pieces_categorie_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pieces_categorie_idx ON public.pieces USING btree (categorie);


--
-- Name: pieces_date_achat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pieces_date_achat_idx ON public.pieces USING btree (date_achat DESC);


--
-- Name: pieces_inventory_part_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pieces_inventory_part_id_idx ON public.pieces USING btree (inventory_part_id);


--
-- Name: pieces_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pieces_user_id_idx ON public.pieces USING btree (user_id);


--
-- Name: publications_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX publications_created_at_idx ON public.publications USING btree (created_at DESC);


--
-- Name: scooter_parts_inventory_action_prevue_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scooter_parts_inventory_action_prevue_idx ON public.scooter_parts_inventory USING btree (action_prevue);


--
-- Name: scooter_parts_inventory_categorie_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scooter_parts_inventory_categorie_idx ON public.scooter_parts_inventory USING btree (categorie);


--
-- Name: scooter_parts_inventory_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scooter_parts_inventory_created_at_idx ON public.scooter_parts_inventory USING btree (created_at DESC);


--
-- Name: scooter_parts_inventory_etat_actuel_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scooter_parts_inventory_etat_actuel_idx ON public.scooter_parts_inventory USING btree (etat_actuel);


--
-- Name: scooter_parts_inventory_piece_commandee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scooter_parts_inventory_piece_commandee_id_idx ON public.scooter_parts_inventory USING btree (piece_commandee_id);


--
-- Name: scooter_parts_inventory_priorite_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scooter_parts_inventory_priorite_idx ON public.scooter_parts_inventory USING btree (priorite);


--
-- Name: scooter_parts_inventory_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX scooter_parts_inventory_user_id_idx ON public.scooter_parts_inventory USING btree (user_id);


--
-- Name: time_entries_category_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX time_entries_category_idx ON public.time_entries USING btree (category);


--
-- Name: time_entries_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX time_entries_created_at_idx ON public.time_entries USING btree (created_at DESC);


--
-- Name: time_entries_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX time_entries_date_idx ON public.time_entries USING btree (date DESC);


--
-- Name: time_entries_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX time_entries_user_id_idx ON public.time_entries USING btree (user_id);


--
-- Name: scooter_parts_inventory update_scooter_parts_inventory_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_scooter_parts_inventory_updated_at BEFORE UPDATE ON public.scooter_parts_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: administrative_charges administrative_charges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.administrative_charges
    ADD CONSTRAINT administrative_charges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: before_after before_after_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.before_after
    ADD CONSTRAINT before_after_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_publication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_publication_id_fkey FOREIGN KEY (publication_id) REFERENCES public.publications(id) ON DELETE CASCADE;


--
-- Name: documents documents_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: inventory_comments inventory_comments_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_comments
    ADD CONSTRAINT inventory_comments_part_id_fkey FOREIGN KEY (part_id) REFERENCES public.scooter_parts_inventory(id) ON DELETE CASCADE;


--
-- Name: likes likes_publication_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_publication_id_fkey FOREIGN KEY (publication_id) REFERENCES public.publications(id) ON DELETE CASCADE;


--
-- Name: pieces pieces_inventory_part_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pieces
    ADD CONSTRAINT pieces_inventory_part_id_fkey FOREIGN KEY (inventory_part_id) REFERENCES public.scooter_parts_inventory(id) ON DELETE SET NULL;


--
-- Name: pieces pieces_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pieces
    ADD CONSTRAINT pieces_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id);


--
-- Name: publications publications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.publications
    ADD CONSTRAINT publications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: scooter_parts_inventory scooter_parts_inventory_piece_commandee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.scooter_parts_inventory
    ADD CONSTRAINT scooter_parts_inventory_piece_commandee_id_fkey FOREIGN KEY (piece_commandee_id) REFERENCES public.pieces(id) ON DELETE SET NULL;


--
-- Name: administrative_charges Ajout admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout admin" ON public.administrative_charges FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: base_purchase Ajout admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout admin" ON public.base_purchase FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: before_after Ajout admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout admin" ON public.before_after FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: documents Ajout admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout admin" ON public.documents FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: owner_history Ajout admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout admin" ON public.owner_history FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: pieces Ajout admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout admin" ON public.pieces FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: publications Ajout admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout admin" ON public.publications FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: scooter_parts_inventory Ajout admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout admin" ON public.scooter_parts_inventory FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: time_entries Ajout admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout admin" ON public.time_entries FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: vehicle_info Ajout admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout admin" ON public.vehicle_info FOR INSERT TO authenticated WITH CHECK (public.is_admin());


--
-- Name: comments Ajout public de commentaires; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout public de commentaires" ON public.comments FOR INSERT TO authenticated, anon WITH CHECK ((((char_length(btrim(author_name)) >= 1) AND (char_length(btrim(author_name)) <= 80)) AND ((char_length(btrim(content)) >= 1) AND (char_length(btrim(content)) <= 2000)) AND ((author_email IS NULL) OR (char_length(author_email) <= 200))));


--
-- Name: inventory_comments Ajout public de commentaires; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Ajout public de commentaires" ON public.inventory_comments FOR INSERT TO authenticated, anon WITH CHECK ((((char_length(btrim(author_name)) >= 1) AND (char_length(btrim(author_name)) <= 80)) AND ((char_length(btrim(content)) >= 1) AND (char_length(btrim(content)) <= 2000)) AND ((author_email IS NULL) OR (char_length(author_email) <= 200))));


--
-- Name: keep_alive Enable read access for all users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for all users" ON public.keep_alive FOR SELECT USING (true);


--
-- Name: profiles Lecture de son propre profil; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture de son propre profil" ON public.profiles FOR SELECT TO authenticated USING (((id = auth.uid()) OR public.is_admin()));


--
-- Name: comments Lecture des commentaires approuvés; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture des commentaires approuvés" ON public.comments FOR SELECT TO authenticated, anon USING (((is_approved = true) OR public.is_admin()));


--
-- Name: inventory_comments Lecture des commentaires approuvés; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture des commentaires approuvés" ON public.inventory_comments FOR SELECT TO authenticated, anon USING (((is_approved = true) OR public.is_admin()));


--
-- Name: administrative_charges Lecture publique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture publique" ON public.administrative_charges FOR SELECT TO authenticated, anon USING (true);


--
-- Name: base_purchase Lecture publique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture publique" ON public.base_purchase FOR SELECT TO authenticated, anon USING (true);


--
-- Name: before_after Lecture publique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture publique" ON public.before_after FOR SELECT TO authenticated, anon USING (true);


--
-- Name: documents Lecture publique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture publique" ON public.documents FOR SELECT TO authenticated, anon USING (true);


--
-- Name: owner_history Lecture publique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture publique" ON public.owner_history FOR SELECT TO authenticated, anon USING (true);


--
-- Name: pieces Lecture publique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture publique" ON public.pieces FOR SELECT TO authenticated, anon USING (true);


--
-- Name: publications Lecture publique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture publique" ON public.publications FOR SELECT TO authenticated, anon USING (true);


--
-- Name: scooter_parts_inventory Lecture publique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture publique" ON public.scooter_parts_inventory FOR SELECT TO authenticated, anon USING (true);


--
-- Name: time_entries Lecture publique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture publique" ON public.time_entries FOR SELECT TO authenticated, anon USING (true);


--
-- Name: vehicle_info Lecture publique; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Lecture publique" ON public.vehicle_info FOR SELECT TO authenticated, anon USING (true);


--
-- Name: administrative_charges Modification admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modification admin" ON public.administrative_charges FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: base_purchase Modification admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modification admin" ON public.base_purchase FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: before_after Modification admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modification admin" ON public.before_after FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: documents Modification admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modification admin" ON public.documents FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: owner_history Modification admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modification admin" ON public.owner_history FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: pieces Modification admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modification admin" ON public.pieces FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: publications Modification admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modification admin" ON public.publications FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: scooter_parts_inventory Modification admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modification admin" ON public.scooter_parts_inventory FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: time_entries Modification admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modification admin" ON public.time_entries FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: vehicle_info Modification admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modification admin" ON public.vehicle_info FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: comments Modération admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modération admin" ON public.comments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: inventory_comments Modération admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Modération admin" ON public.inventory_comments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());


--
-- Name: administrative_charges Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.administrative_charges FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: base_purchase Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.base_purchase FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: before_after Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.before_after FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: comments Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.comments FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: documents Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.documents FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: inventory_comments Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.inventory_comments FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: owner_history Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.owner_history FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: pieces Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.pieces FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: publications Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.publications FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: scooter_parts_inventory Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.scooter_parts_inventory FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: time_entries Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.time_entries FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: vehicle_info Suppression admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Suppression admin" ON public.vehicle_info FOR DELETE TO authenticated USING (public.is_admin());


--
-- Name: administrative_charges; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.administrative_charges ENABLE ROW LEVEL SECURITY;

--
-- Name: base_purchase; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.base_purchase ENABLE ROW LEVEL SECURITY;

--
-- Name: before_after; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.before_after ENABLE ROW LEVEL SECURITY;

--
-- Name: comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

--
-- Name: documents; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: keep_alive; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.keep_alive ENABLE ROW LEVEL SECURITY;

--
-- Name: likes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

--
-- Name: owner_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.owner_history ENABLE ROW LEVEL SECURITY;

--
-- Name: pieces; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pieces ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: publications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

--
-- Name: scooter_parts_inventory; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.scooter_parts_inventory ENABLE ROW LEVEL SECURITY;

--
-- Name: time_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: vehicle_info; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.vehicle_info ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: -
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION is_admin(); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT ALL ON FUNCTION public.is_admin() TO anon;
GRANT ALL ON FUNCTION public.is_admin() TO authenticated;
GRANT ALL ON FUNCTION public.is_admin() TO service_role;


--
-- Name: FUNCTION like_status(p_publication_id uuid, p_fingerprint text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.like_status(p_publication_id uuid, p_fingerprint text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.like_status(p_publication_id uuid, p_fingerprint text) TO anon;
GRANT ALL ON FUNCTION public.like_status(p_publication_id uuid, p_fingerprint text) TO authenticated;
GRANT ALL ON FUNCTION public.like_status(p_publication_id uuid, p_fingerprint text) TO service_role;


--
-- Name: FUNCTION likes_summary(p_fingerprint text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.likes_summary(p_fingerprint text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.likes_summary(p_fingerprint text) TO anon;
GRANT ALL ON FUNCTION public.likes_summary(p_fingerprint text) TO authenticated;
GRANT ALL ON FUNCTION public.likes_summary(p_fingerprint text) TO service_role;


--
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;


--
-- Name: FUNCTION toggle_like(p_publication_id uuid, p_fingerprint text); Type: ACL; Schema: public; Owner: -
--

REVOKE ALL ON FUNCTION public.toggle_like(p_publication_id uuid, p_fingerprint text) FROM PUBLIC;
GRANT ALL ON FUNCTION public.toggle_like(p_publication_id uuid, p_fingerprint text) TO anon;
GRANT ALL ON FUNCTION public.toggle_like(p_publication_id uuid, p_fingerprint text) TO authenticated;
GRANT ALL ON FUNCTION public.toggle_like(p_publication_id uuid, p_fingerprint text) TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: TABLE administrative_charges; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.administrative_charges TO anon;
GRANT ALL ON TABLE public.administrative_charges TO authenticated;
GRANT ALL ON TABLE public.administrative_charges TO service_role;


--
-- Name: TABLE base_purchase; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.base_purchase TO anon;
GRANT ALL ON TABLE public.base_purchase TO authenticated;
GRANT ALL ON TABLE public.base_purchase TO service_role;


--
-- Name: TABLE before_after; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.before_after TO anon;
GRANT ALL ON TABLE public.before_after TO authenticated;
GRANT ALL ON TABLE public.before_after TO service_role;


--
-- Name: TABLE comments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.comments TO anon;
GRANT ALL ON TABLE public.comments TO authenticated;
GRANT ALL ON TABLE public.comments TO service_role;


--
-- Name: TABLE documents; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.documents TO anon;
GRANT ALL ON TABLE public.documents TO authenticated;
GRANT ALL ON TABLE public.documents TO service_role;


--
-- Name: TABLE inventory_comments; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.inventory_comments TO anon;
GRANT ALL ON TABLE public.inventory_comments TO authenticated;
GRANT ALL ON TABLE public.inventory_comments TO service_role;


--
-- Name: TABLE keep_alive; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.keep_alive TO anon;
GRANT ALL ON TABLE public.keep_alive TO authenticated;
GRANT ALL ON TABLE public.keep_alive TO service_role;


--
-- Name: SEQUENCE keep_alive_id_seq; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON SEQUENCE public.keep_alive_id_seq TO anon;
GRANT ALL ON SEQUENCE public.keep_alive_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.keep_alive_id_seq TO service_role;


--
-- Name: TABLE likes; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.likes TO service_role;


--
-- Name: TABLE owner_history; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.owner_history TO anon;
GRANT ALL ON TABLE public.owner_history TO authenticated;
GRANT ALL ON TABLE public.owner_history TO service_role;


--
-- Name: TABLE pieces; Type: ACL; Schema: public; Owner: -
--

GRANT SELECT,REFERENCES,TRIGGER,TRUNCATE,MAINTAIN ON TABLE public.pieces TO anon;
GRANT ALL ON TABLE public.pieces TO authenticated;
GRANT ALL ON TABLE public.pieces TO service_role;


--
-- Name: TABLE profiles; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.profiles TO anon;
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;


--
-- Name: TABLE publications; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.publications TO anon;
GRANT ALL ON TABLE public.publications TO authenticated;
GRANT ALL ON TABLE public.publications TO service_role;


--
-- Name: TABLE scooter_parts_inventory; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.scooter_parts_inventory TO anon;
GRANT ALL ON TABLE public.scooter_parts_inventory TO authenticated;
GRANT ALL ON TABLE public.scooter_parts_inventory TO service_role;


--
-- Name: TABLE time_entries; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.time_entries TO anon;
GRANT ALL ON TABLE public.time_entries TO authenticated;
GRANT ALL ON TABLE public.time_entries TO service_role;


--
-- Name: TABLE vehicle_info; Type: ACL; Schema: public; Owner: -
--

GRANT ALL ON TABLE public.vehicle_info TO anon;
GRANT ALL ON TABLE public.vehicle_info TO authenticated;
GRANT ALL ON TABLE public.vehicle_info TO service_role;


--
-- PostgreSQL database dump complete
--



-- Les expressions des règles de stockage désignent des objets du schéma public
SET search_path = public, extensions;

-- ===== Déclencheur d'événement : protection (RLS) activée sur toute nouvelle table de public =====
DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls ON ddl_command_end EXECUTE FUNCTION public.rls_auto_enable();

-- ===== Stockage : espaces (buckets) =====
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('inventory-photos', 'inventory-photos', true, 5242880, '{image/jpeg,image/jpg,image/png,image/webp,image/gif}'::text[]) ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('media', 'media', true, NULL, NULL) ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ===== Stockage : règles d'accès aux fichiers =====
DROP POLICY IF EXISTS "Admin upload" ON storage.objects;
DROP POLICY IF EXISTS "Lambretta : envoi admin" ON storage.objects;
DROP POLICY IF EXISTS "Lambretta : lecture publique des fichiers" ON storage.objects;
DROP POLICY IF EXISTS "Lambretta : modification admin" ON storage.objects;
DROP POLICY IF EXISTS "Lambretta : suppression admin" ON storage.objects;
CREATE POLICY "Admin upload" ON storage.objects AS PERMISSIVE FOR ALL TO public
  WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.is_admin = true)))));
CREATE POLICY "Lambretta : envoi admin" ON storage.objects AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (((bucket_id = ANY (ARRAY['media'::text, 'inventory-photos'::text])) AND is_admin()));
CREATE POLICY "Lambretta : lecture publique des fichiers" ON storage.objects AS PERMISSIVE FOR SELECT TO anon, authenticated
  USING ((bucket_id = ANY (ARRAY['media'::text, 'inventory-photos'::text])));
CREATE POLICY "Lambretta : modification admin" ON storage.objects AS PERMISSIVE FOR UPDATE TO authenticated
  USING (((bucket_id = ANY (ARRAY['media'::text, 'inventory-photos'::text])) AND is_admin()))
  WITH CHECK (((bucket_id = ANY (ARRAY['media'::text, 'inventory-photos'::text])) AND is_admin()));
CREATE POLICY "Lambretta : suppression admin" ON storage.objects AS PERMISSIVE FOR DELETE TO authenticated
  USING (((bucket_id = ANY (ARRAY['media'::text, 'inventory-photos'::text])) AND is_admin()));

COMMIT;
