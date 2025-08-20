import { PawPrint } from "lucide-react"; // Example icons

export function SpeciesAvatar({
    species,
    className,
}: {
    species: string;
    className?: string;
}) {
    const iconProps = {
        className: className || "w-12 h-12 text-pompaca-purple",
    };

    switch (species) {
        case "Avka Felo":
            return <img src="avka_felo_capsule.png" className="w-5 h-5"></img>;
        case "Nokta Voko":
            return <img src="nokta_voko_capsule.png" className="w-5 h-5"></img>;
        case "Pompaca Floro":
            return <img src="pompaca_floro_capsule.png" className="w-5 h-5"></img>
        case "Sencesa Simfonio":
            return <img src="sencesa_simfonio_capsule.png" className="w-5 h-5"></img>
        case "Ebena Kuranto":
            return <img src="ebena_kuranto_capsule.png" className="w-5 h-5"></img>
            
        default:
            return <PawPrint {...iconProps} />;
    }
}
