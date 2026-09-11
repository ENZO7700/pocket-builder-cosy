import { useEffect } from "react";
import { InstallAppBanner } from "@/components/app/InstallAppBanner";
import { registerServiceWorker } from "@/lib/pwa/offline";

export function PwaRegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return <InstallAppBanner />;
}
