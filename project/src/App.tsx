import { useState, useEffect } from "react";
import { Storefront } from "./components/Storefront";
import { StaffAuth } from "./components/StaffAuth";
import { StaffDashboard } from "./components/StaffDashboard";
import type { StaffAccount } from "./staffTypes";

type PortalState = "storefront" | "auth" | "dashboard";

function getInitialPortalState(): PortalState {
  if (typeof window !== "undefined" && window.location.hash === "#staff-portal") {
    return "auth";
  }
  return "storefront";
}

export default function App() {
  const [portalState, setPortalState] = useState<PortalState>(getInitialPortalState);
  const [staffAccount, setStaffAccount] = useState<StaffAccount | null>(null);

  useEffect(() => {
    function onHashChange() {
      if (window.location.hash === "#staff-portal") {
        if (!staffAccount) setPortalState("auth");
      } else {
        if (portalState !== "dashboard") setPortalState("storefront");
      }
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [staffAccount, portalState]);

  function enterStorefront() {
    window.location.hash = "";
    setPortalState("storefront");
  }

  function handleLogin(account: StaffAccount) {
    setStaffAccount(account);
    setPortalState("dashboard");
  }

  function handleLogout() {
    setStaffAccount(null);
    setPortalState("auth");
  }

  if (portalState === "auth") {
    return <StaffAuth onLogin={handleLogin} onBackToStore={enterStorefront} />;
  }

  if (portalState === "dashboard" && staffAccount) {
    return <StaffDashboard account={staffAccount} onLogout={handleLogout} />;
  }

  return <Storefront />;
}
