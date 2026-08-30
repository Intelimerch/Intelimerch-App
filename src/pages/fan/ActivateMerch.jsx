import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle, Nfc } from "lucide-react";
import MobileShell from "../../components/MobileShell";
import {
  tapAPI,
  getTapToken,
  setTapToken,
  getOwnerToken,
  setOwnerToken,
  readTapToken,
  readOwnerToken,
} from "../../services/apiClient";
import { getDeviceInfo } from "../../utils/getDeviceInfo";

function validateActivation(data) {
  const errors = {};

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.firstName = "First name is required";
  }

  if (!data.email || data.email.trim().length === 0) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Enter a valid email address";
  }

  if (!data.phone || data.phone.trim().length === 0) {
    errors.phone = "Phone number is required";
  }

  if (!data.consentGiven) {
    errors.consentGiven = "You must agree to the Privacy Policy to continue.";
  }

  return errors;
}

function parseErrorMessage(error) {
  const message = error?.message || "";
  if (
    message.includes("already been activated") ||
    message.includes("activated tag")
  ) {
    return "This merch has already been activated.";
  }
  if (message.includes("Privacy Policy") || message.includes("consent")) {
    return "You must agree to the Privacy Policy to continue.";
  }
  if (message.includes("Network")) {
    return "No connection. Check your internet and try again.";
  }
  if (message.includes("timed out")) {
    return "That took too long. Please try again.";
  }
  return message || "We couldn't activate your merch. Please try again.";
}

export default function ActivateMerch() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const tagId = state?.tagId;

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const tapToken = getTapToken();

  const handleChange = (field, value) => {
    const setters = {
      firstName: setFirstName,
      email: setEmail,
      phone: setPhone,
      consentGiven: setConsentGiven,
    };
    if (setters[field]) setters[field](value);
    if (fieldErrors[field])
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    if (apiError) setApiError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError(null);

    const errors = validateActivation({
      firstName,
      email,
      phone,
      consentGiven,
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      // ✅ Get full device info (IP, latitude, longitude, accuracy)
      const deviceInfo = await getDeviceInfo();
      console.log('📍 Device info:', deviceInfo);

      const response = await tapAPI.activate({
        tapToken,
        ownerToken: getOwnerToken() || undefined,
        firstName: firstName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        consentGiven: true,
        deviceType: /iPhone|iPad|iPod/i.test(navigator.userAgent)
          ? "ios"
          : /Mobi|Android/i.test(navigator.userAgent)
            ? "android"
            : "web",

        // ✅ ENABLED: Send full location (IP, lat, long, accuracy)
        location: deviceInfo.latitude
          ? { latitude: deviceInfo.latitude, longitude: deviceInfo.longitude }
          : undefined,
        ip: deviceInfo.ip || undefined,
        latitude: deviceInfo.latitude || undefined,
        longitude: deviceInfo.longitude || undefined,
        accuracy: deviceInfo.accuracy || undefined,
      });

      console.log('activate response:', JSON.stringify(response))

      const newTapToken = readTapToken(response);
      
      if (newTapToken) {
        setTapToken(newTapToken);
        setOwnerToken(newTapToken); // temp: use tapToken until backend returns ownerToken
      }

      localStorage.setItem("fanFirstName", firstName.trim());

      setSuccess(true);
      setTimeout(() => {
        navigate("/fan/activated", { replace: true, state: { tagId } });
      }, 1000);
    } catch (err) {
      console.error("❌ Error activating merch:", err);

      if (
        err?.message?.includes("already been activated") ||
        err?.message?.includes("activated tag")
      ) {
        navigate("/fan/claimed", { replace: true, state: { tagId } });
        return;
      }

      setApiError(parseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const renderError = (field) =>
    fieldErrors[field] ? (
      <div className="flex items-center gap-1.5 mt-1.5 text-red-500 text-xs">
        <AlertCircle size={14} />
        <span>{fieldErrors[field]}</span>
      </div>
    ) : null;

  if (!tapToken) {
    return (
      <MobileShell>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-5">
            <Nfc size={28} className="text-primary" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            Tap your merch to start
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed">
            Hold your phone near the NFC tag on your item. This page opens
            automatically once we detect it.
          </p>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell>
      <div className="mb-8 pt-4 flex justify-center">
        <img
          src="/logo.png"
          alt="Intelimerch"
          className="h-12 w-auto object-contain"
        />
      </div>

      <p className="text-xs font-bold text-primary tracking-widest mb-2">
        FIRST TAP DETECTED
      </p>
      <h1 className="text-5xl font-black leading-tight text-gray-900 mb-1">
        ACTIVATE
      </h1>
      <h1 className="text-5xl font-black leading-tight mb-4">
        YOUR <span className="text-primary">MERCH</span>
      </h1>
      <p className="text-sm text-gray-600 mb-8 leading-relaxed">
        You're holding something exclusive. Register to unlock perks, drops &
        direct access.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            First Name
          </label>
          <input
            className="input-field"
            placeholder="e.g. Jenny"
            value={firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
            disabled={loading || success}
          />
          {renderError("firstName")}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Email
          </label>
          <input
            className="input-field"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={loading || success}
          />
          {renderError("email")}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1.5">
            Phone
          </label>
          <input
            className="input-field"
            type="tel"
            placeholder="09020666789"
            value={phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            disabled={loading || success}
          />
          {renderError("phone")}
        </div>

        {/* Location is now sent automatically via getDeviceInfo() */}

        <div>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 w-5 h-5 rounded border-gray-300 accent-primary shrink-0"
              checked={consentGiven}
              onChange={(e) => handleChange("consentGiven", e.target.checked)}
              disabled={loading || success}
            />
            <span className="text-sm text-gray-600">
              I agree to receive updates from this creator and understand my
              data is handled per their Privacy Policy.
            </span>
          </label>
          {renderError("consentGiven")}
        </div>

        {apiError && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl flex items-start gap-2">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <span>{apiError}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 text-sm p-3 rounded-xl flex items-start gap-2">
            <CheckCircle size={18} className="shrink-0 mt-0.5" />
            <span>Merch activated! Taking you in…</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || success}
          className="btn-primary rounded-full py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Activating…
            </>
          ) : success ? (
            <>
              <CheckCircle size={18} /> Activated!
            </>
          ) : (
            "Activate Merch"
          )}
        </button>
      </form>
    </MobileShell>
  );
}