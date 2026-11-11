import { useState } from 'react';
import { FileText, Calendar, MapPin, Users, Wrench, Hash, Car, Factory, Award, Info, Camera, CreditCard as Edit } from 'lucide-react';
import { useVehicleInfo } from '../hooks/useVehicleInfo';
import { useOwnerHistory } from '../hooks/useOwnerHistory';
import { useAuth } from '../hooks/useAuth';
import { VehicleInfoModal } from '../components/VehicleInfoModal';
import { OwnerHistoryModal } from '../components/OwnerHistoryModal';

export function FicheTechnique() {
  const { vehicleInfo, updateVehicleInfo } = useVehicleInfo();
  const { owners, addOwner, updateOwner, deleteOwner } = useOwnerHistory();
  const { profile } = useAuth();
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);

  const isAdmin = profile?.is_admin ?? false;

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête */}
      <header className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-amber-900 mb-4 font-serif">
          Fiche Technique
        </h2>
        <p className="text-amber-700 text-lg">
          Lambretta LD125 - Modèle 1956 - Fabrication française
        </p>
        <div className="w-24 h-1 bg-amber-300 mx-auto mt-6 rounded-full"></div>
      </header>

      <div className="space-y-8">
        {/* Informations du véhicule */}
        <div className="bg-white rounded-xl border-4 border-amber-200 p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-amber-900 flex items-center space-x-3 font-serif">
              <Car className="h-6 w-6" />
              <span>Informations du véhicule</span>
            </h3>
            {isAdmin && (
              <button
                onClick={() => setShowVehicleModal(true)}
                className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition font-medium"
              >
                <Edit className="h-4 w-4" />
                Éditer
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Hash className="h-5 w-5 text-amber-600 mt-1" />
                <div>
                  <p className="font-semibold text-amber-900">Numéro de série moteur</p>
                  <p className="text-amber-700">{vehicleInfo?.engine_serial_number || 'A relever'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Hash className="h-5 w-5 text-amber-600 mt-1" />
                <div>
                  <p className="font-semibold text-amber-900">Numéro de châssis</p>
                  <p className="text-amber-700">{vehicleInfo?.chassis_number || '114324'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="h-5 w-5 text-amber-600 mt-1" />
                <div>
                  <p className="font-semibold text-amber-900">Immatriculation</p>
                  <p className="text-amber-700">{vehicleInfo?.registration || '3620 XL 80'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-amber-600 mt-1" />
                <div>
                  <p className="font-semibold text-amber-900">Année de fabrication</p>
                  <p className="text-amber-700">{vehicleInfo?.manufacturing_year || '1956'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-amber-600 mt-1" />
                <div>
                  <p className="font-semibold text-amber-900">Lieu de fabrication</p>
                  <p className="text-amber-700">{vehicleInfo?.manufacturing_location || 'St JULIEN, Aube (10), France'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Award className="h-5 w-5 text-amber-600 mt-1" />
                <div>
                  <p className="font-semibold text-amber-900">État actuel</p>
                  <p className="text-amber-700">{vehicleInfo?.current_state || 'En cours de restauration complète'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historique des propriétaires */}
        <div className="bg-white rounded-xl border-4 border-amber-200 p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-amber-900 flex items-center space-x-3 font-serif">
              <Users className="h-6 w-6" />
              <span>Historique des propriétaires</span>
            </h3>
            {isAdmin && (
              <button
                onClick={() => setShowOwnerModal(true)}
                className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition font-medium"
              >
                <Edit className="h-4 w-4" />
                Gérer
              </button>
            )}
          </div>

          <div className="space-y-6">
            {owners.length > 0 ? (
              owners.map((owner) => (
                <div key={owner.id} className={`border-l-4 pl-6 ${owner.is_current ? 'border-green-300' : 'border-amber-300'}`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${owner.is_current ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                    <p className={`font-bold ${owner.is_current ? 'text-green-900' : 'text-amber-900'}`}>
                      {owner.start_year} - {owner.end_year || 'Aujourd\'hui'} : {owner.owner_name}
                    </p>
                  </div>
                  {owner.owner_location && (
                    <p className={`${owner.is_current ? 'text-green-700' : 'text-amber-700'} mb-2`}>
                      <strong>{owner.owner_location}</strong>
                    </p>
                  )}
                  {owner.description && (
                    <p className={`text-sm ${owner.is_current ? 'text-green-600' : 'text-amber-600'}`}>
                      {owner.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="border-l-4 border-amber-300 pl-6">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                  <p className="font-bold text-amber-900">1956 - 1978 : Premier propriétaire</p>
                </div>
                <p className="text-amber-700 mb-2">
                  <strong>Monsieur Jean PHILIPPON</strong> - Limoges, Haute-Vienne
                </p>
                <p className="text-amber-600 text-sm">
                  Achat neuf chez le concessionnaire Lambretta de Troyes. Utilisé quotidiennement
                  pour les trajets domicile-travail pendant 22 ans. Entretien régulier documenté.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Caractéristiques techniques */}
        <div className="bg-white rounded-xl border-4 border-amber-200 p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-amber-900 mb-6 flex items-center space-x-3 font-serif">
            <Wrench className="h-6 w-6" />
            <span>Caractéristiques techniques</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
              <h4 className="font-bold text-amber-900 mb-3">Moteur</h4>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• Type : 2 temps, monocylindre</li>
                <li>• Cylindrée : 125 cm³</li>
                <li>• Puissance : 5,2 ch à 5000 tr/min</li>
                <li>• Refroidissement : Air</li>
                <li>• Allumage : Volant magnétique</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
              <h4 className="font-bold text-amber-900 mb-3">Transmission</h4>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• Boîte : 3 vitesses</li>
                <li>• Embrayage : Centrifuge</li>
                <li>• Transmission : Par câbles</li>
                <li>• Démarrage : Kick</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
              <h4 className="font-bold text-amber-900 mb-3">Châssis</h4>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• Structure : Monocoque acier</li>
                <li>• Suspension AV : Bras oscillant</li>
                <li>• Suspension AR : Ressort hélicoïdal</li>
                <li>• Freins : Tambours 150mm</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
              <h4 className="font-bold text-amber-900 mb-3">Dimensions</h4>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• Longueur : 1780 mm</li>
                <li>• Largeur : 650 mm</li>
                <li>• Hauteur : 1100 mm</li>
                <li>• Empattement : 1235 mm</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
              <h4 className="font-bold text-amber-900 mb-3">Performances</h4>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• Vitesse max : 80 km/h</li>
                <li>• Consommation : 3L/100km</li>
                <li>• Réservoir : 6,5 litres</li>
                <li>• Poids à sec : 78 kg</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 rounded-lg p-4 border-2 border-amber-200">
              <h4 className="font-bold text-amber-900 mb-3">Équipements</h4>
              <ul className="space-y-1 text-sm text-amber-700">
                <li>• Phare : 6V 25/25W</li>
                <li>• Roue de secours</li>
                <li>• Coffre sous selle</li>
                <li>• Béquille centrale</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Photos nostalgiques */}
        <div className="bg-white rounded-xl border-4 border-amber-200 p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-amber-900 mb-6 flex items-center space-x-3 font-serif">
            <Camera className="h-6 w-6" />
            <span>Souvenirs d'époque</span>
          </h3>
          
          <div className="text-center mb-6">
            <p className="text-amber-700 italic text-lg leading-relaxed">
              "Voici Papa à 17 ans avec son Lambretta, capturant l'esprit de liberté 
              et d'aventure des années 60..."
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Placeholder pour la première photo */}
            <div className="relative">
  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-8 border-4 border-amber-200 shadow-inner">
    <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-400 overflow-hidden">
      <img
        loading="lazy"
        decoding="async"
        src="https://i28.servimg.com/u/f28/12/40/02/10/whatsa18.jpg"
        alt="Papa à 17 ans avec son Lambretta"
        className="object-cover w-full h-full"
      />
    </div>
  </div>
  <div className="absolute -bottom-2 -right-2 bg-amber-200 rounded-full p-2 shadow-lg">
    <Calendar className="h-4 w-4 text-amber-800" />
  </div>
</div>

            
            {/* Placeholder pour la deuxième photo */}
            <div className="relative">
  <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg p-8 border-4 border-amber-200 shadow-inner">
    <div className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-400 overflow-hidden">
      <img
        loading="lazy"
        decoding="async"
        src="https://i28.servimg.com/u/f28/12/40/02/10/whatsa15.jpg"
        alt="Souvenirs de jeunesse"
        className="object-cover w-full h-full"
      />
    </div>
  </div>
  <div className="absolute -bottom-2 -right-2 bg-amber-200 rounded-full p-2 shadow-lg">
    <Calendar className="h-4 w-4 text-amber-800" />
  </div>
</div>

          </div>
          
          <div className="mt-8 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-6 border-2 border-amber-200">
            <p className="text-amber-800 text-center italic">
              "Ces photos en noir et blanc témoignent d'une époque où le Lambretta 
              représentait la liberté et l'indépendance pour toute une génération. 
              Aujourd'hui, cette restauration est un hommage à ces souvenirs précieux."
            </p>
          </div>
        </div>

        {/* Historique du modèle */}
        <div className="bg-white rounded-xl border-4 border-amber-200 p-8 shadow-lg">
          <h3 className="text-2xl font-bold text-amber-900 mb-6 flex items-center space-x-3 font-serif">
            <Info className="h-6 w-6" />
            <span>Historique du modèle LD125</span>
          </h3>
          
          <div className="prose prose-amber max-w-none">
            <p className="text-amber-700 leading-relaxed mb-4">
              Le <strong>Lambretta LD125</strong> fut lancé en 1954 par Innocenti comme l'évolution 
              du modèle LC. Il représentait une amélioration significative avec son nouveau moteur 
              125cc plus puissant et ses lignes redessinées plus modernes.
            </p>
            
            <p className="text-amber-700 leading-relaxed mb-4">
              En France, la production était assurée par l'usine de <strong>Troyes dans l'Aube</strong>, 
              sous licence Innocenti. Cette production locale permettait d'éviter les taxes d\'importation 
              et de proposer des prix plus compétitifs face à la concurrence Vespa.
            </p>
            
            <p className="text-amber-700 leading-relaxed mb-6">
              Le LD125 connut un grand succès commercial grâce à sa fiabilité, sa facilité d'entretien 
              et son style élégant. Il fut produit jusqu'en 1958, remplacé ensuite par la série Li.
            </p>
            
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg p-6 border-2 border-amber-200">
              <h4 className="font-bold text-amber-900 mb-4 flex items-center space-x-2">
                <Factory className="h-5 w-5" />
                <span>Chiffres de production</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-amber-700"><strong>Production mondiale LD125 :</strong></p>
                  <p className="text-amber-900 font-bold text-lg">~180 000 exemplaires</p>
                </div>
                <div>
                  <p className="text-amber-700"><strong>Production française (Troyes) :</strong></p>
                  <p className="text-amber-900 font-bold text-lg">~25 000 exemplaires</p>
                </div>
                <div>
                  <p className="text-amber-700"><strong>Exemplaires survivants estimés :</strong></p>
                  <p className="text-amber-900 font-bold text-lg">~2 000 exemplaires</p>
                </div>
                <div>
                  <p className="text-amber-700"><strong>Cote actuelle (restauré) :</strong></p>
                  <p className="text-amber-900 font-bold text-lg">4 000 - 8 000 €</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Note personnelle */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-xl p-8 border-4 border-amber-200 text-center">
          <p className="text-amber-800 font-medium italic text-lg leading-relaxed">
            "Ce Lambretta LD125 représente bien plus qu'un simple véhicule : c'est un témoin 
            de l'histoire industrielle française et un symbole de liberté des années 50-60. 
            Sa restauration est un hommage à tous ceux qui l'ont précédé."
          </p>
          <p className="text-amber-700 mt-4 font-semibold">
            — Cyril, restaurateur passionné
          </p>
        </div>
      </div>

      <VehicleInfoModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
        onSave={updateVehicleInfo}
        initialData={vehicleInfo}
      />

      <OwnerHistoryModal
        isOpen={showOwnerModal}
        onClose={() => setShowOwnerModal(false)}
        onAdd={addOwner}
        onUpdate={updateOwner}
        onDelete={deleteOwner}
        owners={owners}
      />
    </div>
  );
}
