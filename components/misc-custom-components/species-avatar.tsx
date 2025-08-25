import { PawPrint } from "lucide-react"; // Example icons

export function SpeciesAvatar({
    species,
    className,
}: {
    species: string;
    className?: string;
}) {
    const imgClassName = className || "w-5 h-5";

    switch (species) {
        case "Abomena Pahidermo":
            return (
                <img
                    src="abomena_pahidermo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Alta Koltuko":
            return (
                <img
                    src="alta_koltuko_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Arba Brakumo":
            return (
                <img
                    src="arba_brakumo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Arbara Krono":
            return (
                <img
                    src="arbara_krono_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Arda Vosto":
            return (
                <img
                    src="arda_vosto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Avka Felo":
            return (
                <img src="avka_felo_capsule.png" className={imgClassName}></img>
            );
        case "Bera Manganto":
            return (
                <img
                    src="bera_manganto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Brila Ornamo":
            return (
                <img
                    src="brila_ornamo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Cielarka Cimo":
            return (
                <img
                    src="cielarka_cimo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Degela Koro":
            return (
                <img
                    src="degela_koro_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Dentega Salto":
            return (
                <img
                    src="dentega_salto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Dormema Ventreto":
            return (
                <img
                    src="dormema_ventreto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Dorna Maco":
            return (
                <img
                    src="dorna_maco_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Ebena Kuranto":
            return (
                <img
                    src="ebena_kuranto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Ekvinoska Kavigo":
            return (
                <img
                    src="ekvinoska_kavigo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Etarakido":
            return (
                <img src="etarakido_capsule.png" className={imgClassName}></img>
            );
        case "Flirtanta Flamo":
            return (
                <img
                    src="flirtanta_flamo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Floranta Doloro":
            return (
                <img
                    src="floranta_doloro_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Fluganta Rato":
            return (
                <img
                    src="fluganta_rato_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Frida Fisisto":
            return (
                <img
                    src="frida_fisisto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Furioza Vizago":
            return (
                <img
                    src="furioza_vizago_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Glacia Alsalto":
            return (
                <img
                    src="glacia_alsalto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Glita Skvamo":
            return (
                <img
                    src="glita_skvamo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Glubleko":
            return (
                <img src="glubleko_capsule.png" className={imgClassName}></img>
            );
        case "Gudra Kornaro":
            return (
                <img
                    src="gudra_kornaro_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Imsanga Afero":
            return (
                <img
                    src="imsanga_afero_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Inkuba Brulajo":
            return (
                <img
                    src="inkuba_brulajo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Kasa Gardanto":
            return (
                <img
                    src="kasa_gardanto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Kauri Makzelo":
            return (
                <img
                    src="kauri_makzelo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Klara Alsalto":
            return (
                <img
                    src="klara_alsalto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Klipeta Kapto":
            return (
                <img
                    src="klipeta_kapto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Koleratako":
            return (
                <img
                    src="koleratako_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Kora Voko":
            return (
                <img src="kora_voko_capsule.png" className={imgClassName}></img>
            );
        case "Kosmira Girafo":
            return (
                <img
                    src="kosmira_girafo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Kvieta Kiraso":
            return (
                <img
                    src="kvieta_kiraso_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Lanuga Vizago":
            return (
                <img
                    src="lanuga_vizago_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Limaka Cevalo":
            return (
                <img
                    src="limaka_cevalo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Luma Mordo":
            return (
                <img
                    src="luma_mordo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Luna Hundo":
            return (
                <img
                    src="luna_hundo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Malbenita Beno":
            return (
                <img
                    src="malbenita_beno_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Malvolva Kapo":
            return (
                <img
                    src="malvolva_kapo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Membra Cerbo":
            return (
                <img
                    src="membra_cerbo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Minuskla Casadisto":
            return (
                <img
                    src="minuskla_casadisto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Monta Selo":
            return (
                <img
                    src="monta_selo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Muska Felo":
            return (
                <img
                    src="muska_felo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Muskbirdo":
            return (
                <img src="muskbirdo_capsule.png" className={imgClassName}></img>
            );
        case "Nebula Glisanto":
            return (
                <img
                    src="nebula_glisanto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Nektara Veziko":
            return (
                <img
                    src="nektara_veziko_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Netimo":
            return (
                <img src="netimo_capsule.png" className={imgClassName}></img>
            );
        case "Nokta Voko":
            return (
                <img
                    src="nokta_voko_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Okula Pikilo":
            return (
                <img
                    src="okula_pikilo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Ombra Vesperto":
            return (
                <img
                    src="ombra_vesperto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Osta Frakaso":
            return (
                <img
                    src="osta_frakaso_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Pieda Pastigo":
            return (
                <img
                    src="pieda_pastigo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Pompaca Floro":
            return (
                <img
                    src="pompaca_floro_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Ranbleko":
            return (
                <img src="ranbleko_capsule.png" className={imgClassName}></img>
            );
        case "Reganta Plumaro":
            return (
                <img
                    src="reganta_plumaro_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Rida Frakaso":
            return (
                <img
                    src="rida_frakaso_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Ruzafolio":
            return (
                <img src="ruzafolio_capsule.png" className={imgClassName}></img>
            );
        case "Sabla Rego":
            return (
                <img
                    src="sabla_rego_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Saltanta":
            return (
                <img src="saltanta_capsule.png" className={imgClassName}></img>
            );
        case "Sauma Kudrilo":
            return (
                <img
                    src="sauma_kudrilo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Sencesa Simfonio":
            return (
                <img
                    src="sencesa_simfonio_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Senfina Krizo":
            return (
                <img
                    src="senfina_krizo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Senvida Naganto":
            return (
                <img
                    src="senvida_naganto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Silenta Spuristo":
            return (
                <img
                    src="silenta_spuristo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Songa Kreinto":
            return (
                <img
                    src="songa_kreinto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Stepa Safido":
            return (
                <img
                    src="stepa_safido_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Stranga Sciuro":
            return (
                <img
                    src="stranga_sciuro_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Strigosto":
            return (
                <img src="strigosto_capsule.png" className={imgClassName}></img>
            );
        case "Suna Hundo":
            return (
                <img
                    src="suna_hundo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Tagalo":
            return (
                <img src="tagalo_capsule.png" className={imgClassName}></img>
            );
        case "Tagluma Valso":
            return (
                <img
                    src="tagluma_valso_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Tera Girafo":
            return (
                <img
                    src="tera_girafo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Terura Fisisto":
            return (
                <img
                    src="terura_fisisto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Timiga Dancanto":
            return (
                <img
                    src="timiga_dancanto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Toksa Muko":
            return (
                <img
                    src="toksa_muko_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Tonbleko":
            return (
                <img src="tonbleko_capsule.png" className={imgClassName}></img>
            );
        case "Transira Alsalto":
            return (
                <img
                    src="transira_alsalto_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Vetura Oazo":
            return (
                <img
                    src="vetura_oazo_capsule.png"
                    className={imgClassName}
                ></img>
            );
        case "Vira Beko":
            return (
                <img src="vira_beko_capsule.png" className={imgClassName}></img>
            );
        default:
            return <PawPrint className={imgClassName} />;
    }
}
