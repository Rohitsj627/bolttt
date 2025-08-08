import { useEffect, useState } from "react";
import { WebContainer } from '@webcontainer/api';

export function useWebContainer() {
    const [webcontainer, setWebcontainer] = useState<WebContainer>();
    const [loading, setLoading] = useState(true);

    async function main() {
        try {
            console.log("Booting WebContainer...");
        const webcontainerInstance = await WebContainer.boot();
            console.log("WebContainer booted successfully");
            setWebcontainer(webcontainerInstance);
        } catch (error) {
            console.error("Failed to boot WebContainer:", error);
        } finally {
            setLoading(false);
        }
    }
    
    useEffect(() => {
        main();
    }, [])

    return { webcontainer, loading };
}