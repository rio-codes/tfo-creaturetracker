import { PawPrint } from 'lucide-react'; // Example icons

export function SpeciesAvatar({ species, className }: { species: string; className?: string }) {
    const imgClassName = className || 'w-5 h-5';

    switch (species) {
        case 'Abomena Pahidermo':
            return (
                <img
                    src="/images/capsules/abomena_pahidermo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Alta Koltuko':
            return (
                <img src="/images/capsules/alta_koltuko_capsule.png" className={imgClassName}></img>
            );
        case 'Arba Brakumo':
            return (
                <img src="/images/capsules/arba_brakumo_capsule.png" className={imgClassName}></img>
            );
        case 'Arbara Krono':
            return (
                <img src="/images/capsules/arbara_krono_capsule.png" className={imgClassName}></img>
            );
        case 'Arda Vosto':
            return (
                <img src="/images/capsules/arda_vosto_capsule.png" className={imgClassName}></img>
            );
        case 'Avka Felo':
            return (
                <img src="/images/capsules/avka_felo_capsule.png" className={imgClassName}></img>
            );
        case 'Bera Manganto':
            return (
                <img
                    src="/images/capsules/bera_manganto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Brila Ornamo':
            return (
                <img src="/images/capsules/brila_ornamo_capsule.png" className={imgClassName}></img>
            );
        case 'Cielarka Cimo':
            return (
                <img
                    src="/images/capsules/cielarka_cimo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Degela Koro':
            return (
                <img src="/images/capsules/degela_koro_capsule.png" className={imgClassName}></img>
            );
        case 'Dentega Salto':
            return (
                <img
                    src="/images/capsules/dentega_salto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Dormema Ventreto':
            return (
                <img
                    src="/images/capsules/dormema_ventreto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Dorna Maco':
            return (
                <img src="/images/capsules/dorna_maco_capsule.png" className={imgClassName}></img>
            );
        case 'Ebena Kuranto':
            return (
                <img
                    src="/images/capsules/ebena_kuranto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Ekvinoska Kavigo':
            return (
                <img
                    src="/images/capsules/ekvinoska_kavigo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Etarakido':
            return (
                <img src="/images/capsules/etarakido_capsule.png" className={imgClassName}></img>
            );
        case 'Flirtanta Flamo':
            return (
                <img
                    src="/images/capsules/flirtanta_flamo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Floranta Doloro':
            return (
                <img
                    src="/images/capsules/floranta_doloro_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Fluganta Rato':
            return (
                <img
                    src="/images/capsules/fluganta_rato_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Frida Fisisto':
            return (
                <img
                    src="/images/capsules/frida_fisisto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Furioza Vizago':
            return (
                <img
                    src="/images/capsules/furioza_vizago_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Glacia Alsalto':
            return (
                <img
                    src="/images/capsules/glacia_alsalto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Glita Skvamo':
            return (
                <img src="/images/capsules/glita_skvamo_capsule.png" className={imgClassName}></img>
            );
        case 'Glubleko':
            return <img src="/images/capsules/glubleko_capsule.png" className={imgClassName}></img>;
        case 'Gudra Kornaro':
            return (
                <img
                    src="/images/capsules/gudra_kornaro_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Imsanga Afero':
            return (
                <img
                    src="/images/capsules/imsanga_afero_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Inkuba Brulajo':
            return (
                <img
                    src="/images/capsules/inkuba_brulajo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Kasa Gardanto':
            return (
                <img
                    src="/images/capsules/kasa_gardanto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Kauri Makzelo':
            return (
                <img
                    src="/images/capsules/kauri_makzelo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Klara Alsalto':
            return (
                <img
                    src="/images/capsules/klara_alsalto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Klipeta Kapto':
            return (
                <img
                    src="/images/capsules/klipeta_kapto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Koleratako':
            return (
                <img src="/images/capsules/koleratako_capsule.png" className={imgClassName}></img>
            );
        case 'Kora Voko':
            return (
                <img src="/images/capsules/kora_voko_capsule.png" className={imgClassName}></img>
            );
        case 'Kosmira Girafo':
            return (
                <img
                    src="/images/capsules/kosmira_girafo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Kvieta Kiraso':
            return (
                <img
                    src="/images/capsules/kvieta_kiraso_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Lanuga Vizago':
            return (
                <img
                    src="/images/capsules/lanuga_vizago_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Limaka Cevalo':
            return (
                <img
                    src="/images/capsules/limaka_cevalo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Luma Mordo':
            return (
                <img src="/images/capsules/luma_mordo_capsule.png" className={imgClassName}></img>
            );
        case 'Luna Hundo':
            return (
                <img src="/images/capsules/luna_hundo_capsule.png" className={imgClassName}></img>
            );
        case 'Malbenita Beno':
            return (
                <img
                    src="/images/capsules/malbenita_beno_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Malvolva Kapo':
            return (
                <img
                    src="/images/capsules/malvolva_kapo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Membra Cerbo':
            return (
                <img src="/images/capsules/membra_cerbo_capsule.png" className={imgClassName}></img>
            );
        case 'Minuskla Casadisto':
            return (
                <img
                    src="/images/capsules/minuskla_casadisto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Monta Selo':
            return (
                <img src="/images/capsules/monta_selo_capsule.png" className={imgClassName}></img>
            );
        case 'Muska Felo':
            return (
                <img src="/images/capsules/muska_felo_capsule.png" className={imgClassName}></img>
            );
        case 'Muskbirdo':
            return (
                <img src="/images/capsules/muskbirdo_capsule.png" className={imgClassName}></img>
            );
        case 'Nebula Glisanto':
            return (
                <img
                    src="/images/capsules/nebula_glisanto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Nektara Veziko':
            return (
                <img
                    src="/images/capsules/nektara_veziko_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Netimo':
            return <img src="/images/capsules/netimo_capsule.png" className={imgClassName}></img>;
        case 'Nokta Voko':
            return (
                <img src="/images/capsules/nokta_voko_capsule.png" className={imgClassName}></img>
            );
        case 'Okula Pikilo':
            return (
                <img src="/images/capsules/okula_pikilo_capsule.png" className={imgClassName}></img>
            );
        case 'Ombra Vesperto':
            return (
                <img
                    src="/images/capsules/ombra_vesperto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Osta Frakaso':
            return (
                <img src="/images/capsules/osta_frakaso_capsule.png" className={imgClassName}></img>
            );
        case 'Pieda Pastigo':
            return (
                <img
                    src="/images/capsules/pieda_pastigo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Pompaca Floro':
            return (
                <img
                    src="/images/capsules/pompaca_floro_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Ranbleko':
            return <img src="/images/capsules/ranbleko_capsule.png" className={imgClassName}></img>;
        case 'Reganta Plumaro':
            return (
                <img
                    src="/images/capsules/reganta_plumaro_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Rida Frakaso':
            return (
                <img src="/images/capsules/rida_frakaso_capsule.png" className={imgClassName}></img>
            );
        case 'Ruzafolio':
            return (
                <img src="/images/capsules/ruzafolio_capsule.png" className={imgClassName}></img>
            );
        case 'Sabla Rego':
            return (
                <img src="/images/capsules/sabla_rego_capsule.png" className={imgClassName}></img>
            );
        case 'Saltanta':
            return <img src="/images/capsules/saltanta_capsule.png" className={imgClassName}></img>;
        case 'Sauma Kudrilo':
            return (
                <img
                    src="/images/capsules/sauma_kudrilo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Sencesa Simfonio':
            return (
                <img
                    src="/images/capsules/sencesa_simfonio_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Senfina Krizo':
            return (
                <img
                    src="/images/capsules/senfina_krizo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Senvida Naganto':
            return (
                <img
                    src="/images/capsules/senvida_naganto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Silenta Spuristo':
            return (
                <img
                    src="/images/capsules/silenta_spuristo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Songa Kreinto':
            return (
                <img
                    src="/images/capsules/songa_kreinto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Stepa Safido':
            return (
                <img src="/images/capsules/stepa_safido_capsule.png" className={imgClassName}></img>
            );
        case 'Stranga Sciuro':
            return (
                <img
                    src="/images/capsules/stranga_sciuro_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Strigosto':
            return (
                <img src="/images/capsules/strigosto_capsule.png" className={imgClassName}></img>
            );
        case 'Suna Hundo':
            return (
                <img src="/images/capsules/suna_hundo_capsule.png" className={imgClassName}></img>
            );
        case 'Tagalo':
            return <img src="/images/capsules/tagalo_capsule.png" className={imgClassName}></img>;
        case 'Tagluma Valso':
            return (
                <img
                    src="/images/capsules/tagluma_valso_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Tera Girafo':
            return (
                <img src="/images/capsules/tera_girafo_capsule.png" className={imgClassName}></img>
            );
        case 'Terura Fisisto':
            return (
                <img
                    src="/images/capsules/terura_fisisto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Timiga Dancanto':
            return (
                <img
                    src="/images/capsules/timiga_dancanto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Toksa Muko':
            return (
                <img src="/images/capsules/toksa_muko_capsule.png" className={imgClassName}></img>
            );
        case 'Tonbleko':
            return <img src="/images/capsules/tonbleko_capsule.png" className={imgClassName}></img>;
        case 'Transira Alsalto':
            return (
                <img
                    src="/images/capsules/transira_alsalto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case 'Vetura Oazo':
            return (
                <img src="/images/capsules/vetura_oazo_capsule.png" className={imgClassName}></img>
            );
        case 'Vira Beko':
            return (
                <img src="/images/capsules/vira_beko_capsule.png" className={imgClassName}></img>
            );
        default:
            return <PawPrint className={imgClassName} />;
    }
}
