const redirect_uri = `${origin}/fiskil/callback`;
const cancel_uri = `${origin}/onboarding`;
import FiskilCallbackPage from "./pages/FiskilCallback";
  if (path === "/fiskil/callback") {
    return (
      <div className="min-h-[100dvh] min-h-screen bg-slate-950 text-white">
        {backgroundLayers}
        <FiskilCallbackPage />
      </div>
    );
  }
