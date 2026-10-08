// src/pages/fan/TapEntry.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, AlertCircle, Nfc } from "lucide-react";
import MobileShell from "../../components/MobileShell";
import {
  tapAPI,
  getOwnerToken,
  setTapToken,
  setOwnerToken,
  getTapToken,
  readTapToken,
  readOwnerToken,
  readTapOutcome,
  TAP_OUTCOME,
  getDeviceInfo,
} from "../../services/apiClient";

function parseErrorMessage(error) {
  const message = (error?.message || "").toLowerCase();
  const code = error?.code || "";

  if (
    code === "FAN_SESSION_EXPIRED" ||
    message.includes("jwt expired") ||
    message.includes("token expired") ||
    message.includes("session expired") ||
    message.includes("session has ended")
  ) {
    return "Your tap session has ended. Tap your merch again to restart.";
  }

  if (
    message.includes("cannot read properties of null") ||
    message.includes("tag not found")
  ) {
    return "We couldn't find this tag. Please tap your merch again.";
  }

  if (
    message.includes("invalid objectid") ||
    message.includes("404") ||
    message.includes("not found")
  ) {
    return "We couldn't find this tag. It may not be registered yet — try again, or contact the seller.";
  }

  if (message.includes("claimed") || message.includes("belongs to another")) {
    return "Hold up! This merch belongs to another user.";
  }

  if (message.includes("network") || message.includes("fetch failed")) {
    return "No connection. Check your internet and tap again.";
  }

  if (message.includes("timed out") || message.includes("timeout")) {
    return "That took too long. Tap again to retry.";
  }

  return "Something went wrong reading your merch. Please tap again.";
}

export default function TapEntry() {
  const { tagId } = useParams();
  const navigate = useNavigate();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const hasTapped = useRef(false);

  const runTap = async () => {
    setLoading(true);
    setError(null);

    const ownerToken = getOwnerToken();
    const tapToken = getTapToken();
    if (ownerToken && ownerToken === tapToken) {
      localStorage.removeItem("ownerToken");
    }

    try {
      const deviceInfo = await getDeviceInfo();
      console.log("📍 Device info:", deviceInfo);

      const response = await tapAPI.tap(tagId, {
        ownerToken: getOwnerToken() || undefined,

        deviceType: /iPhone|iPad|iPod/i.test(navigator.userAgent)
          ? "ios"
          : /Mobi|Android/i.test(navigator.userAgent)
            ? "android"
            : "web",

        location: {
          country: deviceInfo.country || "Unknown",
          state: deviceInfo.state || "Unknown",
          city: deviceInfo.city || "Unknown",
          ...(deviceInfo.ip && { ip: deviceInfo.ip }),
          ...(deviceInfo.latitude != null && { latitude: deviceInfo.latitude }),
          ...(deviceInfo.longitude != null && { longitude: deviceInfo.longitude }),
          ...(deviceInfo.accuracy != null && { accuracy: deviceInfo.accuracy }),
        },
      });

      const newTapToken = readTapToken(response);
      const ownerTokenFromResp = readOwnerToken(response);
      const outcome = readTapOutcome(response);

      if (newTapToken) {
        setTapToken(newTapToken);
        console.log("✅ TapToken saved:", newTapToken);
      } else {
        console.error("❌ No tapToken in response:", response);
        setError("Could not get a valid token. Please tap again.");
        setLoading(false);
        return;
      }

      if (ownerTokenFromResp) setOwnerToken(ownerTokenFromResp);

      if (outcome === TAP_OUTCOME.RETURNING) {
        console.log("✅ RETURNING - Going to perks");
        navigate("/fan/perks", { replace: true, state: { tagId } });
        return;
      }

      if (outcome === TAP_OUTCOME.CLAIMED) {
        console.log("🚫 CLAIMED - Going to claimed page");
        navigate("/fan/claimed", {
          replace: true,
          state: {
            tagId,
            ownerFirstName: response?.ownerFirstName || null,
            socials: response?.socials || null,
          },
        });
        return;
      }

      console.log("🆕 FRESH - Going to activation");
      navigate("/fan/activate", { replace: true, state: { tagId } });
    } catch (err) {
      console.error("❌ Tap failed:", err);

      if (
        err?.status === 403 ||
        err?.message?.includes("claimed") ||
        err?.message?.includes("belongs to another")
      ) {
        // Pass owner name + artist socials to the claimed page
        navigate("/fan/claimed", {
          replace: true,
          state: {
            tagId,
            ownerFirstName: err?.ownerFirstName || null,
            socials: err?.socials || null,
          },
        });
        return;
      }

      setError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasTapped.current) return;
    hasTapped.current = true;
    runTap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagId]);

  if (loading) {
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <Nfc size={28} className="text-primary" />
          </div>
          <Loader2 size={24} className="text-primary animate-spin mb-3" />
          <p className="font-bold text-gray-900">Reading your merch…</p>
          <p className="text-sm text-gray-500 mt-1">
            Hold tight, this only takes a second.
          </p>
        </div>
      </MobileShell>
    );
  }

  if (error) {
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
            <AlertCircle size={28} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            Couldn't read that tap
          </h1>
          <p className="text-sm text-gray-600 mb-8 leading-relaxed">{error}</p>
          <button
            onClick={runTap}
            className="btn-primary rounded-full py-4 text-base font-bold w-full"
          >
            Try again
          </button>
        </div>
      </MobileShell>
    );
  }

  return null;
}