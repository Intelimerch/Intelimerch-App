// src/pages/fan/ActivateMerch.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, AlertCircle, CheckCircle, Nfc } from "lucide-react";
import MobileShell from "../../components/MobileShell";
import {
  tapAPI,
  getTapToken,
  setTapToken,
  setOwnerToken,
  getOwnerToken,
  readTapToken,
  readOwnerToken,
} from "../../services/apiClient";
import { getDeviceInfo } from "../../utils/getDeviceInfo";

const PHONE_PREFIX = "+234";

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

  const localPhone = (data.phone || "").replace(/\D/g, "");
  if (!localPhone) {
    errors.phone = "Phone number is required";
  } else if (localPhone.length < 10) {
    errors.phone = "Enter a valid phone number (10 digits)";
  }

  if (!data.consentGiven) {
    errors.consentGiven = "You must agree to the Privacy Policy to continue.";
  }

  return errors;
}

function normaliseLocalPhone(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  return digits.startsWith("0") ? digits.slice(1) : digits;
}

function buildFullPhone(raw) {
  const local = normaliseLocalPhone(raw);
  return local ? `${PHONE_PREFIX}${local}` : "";
}

function parseErrorMessage(error) {
  const message = (error?.message || "").toLowerCase();
  const code = error?.code || "";

  // Token expired
  if (
    code === "FAN_SESSION_EXPIRED" ||
    message.includes("jwt expired") ||
    message.includes("token expired") ||
    message.includes("session expired") ||
    message.includes("session has ended")
  ) {
    return "Your activation session has ended. Tap your merch again to restart.";
  }

  // Duplicate key
  if (message.includes("e11000") || message.includes("duplicate key")) {
    if (message.includes("email")) {
      return "This email is already registered. Try a different email, or tap your merch again to continue as this fan.";
    }
    if (message.includes("phone")) {
      return "This phone number is already registered. Try a different one.";
    }
    return "Some of your details are already in use. Please check them and try again.";
  }

  if (
    message.includes("tag not found") ||
    message.includes("cannot read properties of null")
  ) {
    return "We couldn't find this tag. Please tap your merch again to get a valid token.";
  }
  if (
    message.includes("already been activated") ||
    message.includes("activated tag")
  ) {
    return "This merch has already been activated.";
  }
  if (message.includes("privacy policy") || message.includes("consent")) {
    return "You must agree to the Privacy Policy to continue.";
  }
  if (message.includes("invalid objectid")) {
    return "Something went wrong with your session. Please tap your merch again to restart.";
  }
  if (message.includes("network") || message.includes("fetch failed")) {
    return "No connection. Check your internet and try again.";
  }
  if (message.includes("timed out") || message.includes("timeout")) {
    return "That took too long. Please try again.";
  }

  return "We couldn't activate your merch. Please tap your merch again to restart.";
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
    if (field === "phone") {
      value = value.replace(/\D/g, "").slice(0, 11);
    }

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

    if (!tapToken) {
      setApiError(
        "Your session has expired. Please tap your merch again to start.",
      );
      return;
    }

    setLoading(true);
    try {
      const deviceInfo = await getDeviceInfo();
      console.log("📍 Device info:", deviceInfo);

      const fullPhone = buildFullPhone(phone);

      const response = await tapAPI.activate({
        tapToken,
        firstName: firstName.trim(),
        email: email.trim().toLowerCase(),
        phone: fullPhone,
        consentGiven: true,

        deviceType: /iPhone|iPad|iPod/i.test(navigator.userAgent)
          ? "ios"
          : /Mobi|Android/i.test(navigator.userAgent)
            ? "android"
            : "web",

        location: {
          country: deviceInfo.country || "Unknown",
          state: deviceInfo.state || "Unknown",
          city: deviceInfo.city || "Unknown",
        },
      });

      const newTapToken = readTapToken(response);
      if (newTapToken) setTapToken(newTapToken);

      const newOwnerToken = readOwnerToken(response);
      if (newOwnerToken) setOwnerToken(newOwnerToken);

      localStorage.setItem("fanFirstName", firstName.trim());

      setSuccess(true);
      setTimeout(() => {
        navigate("/fan/activated", { replace: true, state: { tagId } });
      }, 1000);
    } catch (err) {
      console.error("❌ Error activating merch:", err);

      const message = (err?.message || "").toLowerCase();
      const code = err?.code || "";

      // Token expired → clear tokens and ask to re-tap
      if (
        code === "FAN_SESSION_EXPIRED" ||
        message.includes("jwt expired") ||
        message.includes("token expired") ||
        message.includes("session expired") ||
        message.includes("session has ended")
      ) {
        sessionStorage.removeItem("tapToken");
        localStorage.removeItem("ownerToken");
        setApiError(
          "Your activation session has ended. Tap your merch again to restart.",
        );
        setLoading(false);
        return;
      }

      if (
        message.includes("tag not found") ||
        message.includes("cannot read properties of null")
      ) {
        sessionStorage.removeItem("tapToken");
        localStorage.removeItem("ownerToken");

        setApiError(
          "We couldn't find this tag. Please tap your merch again to get a valid token.",
        );
        setLoading(false);
        return;
      }

      if (
        message.includes("already been activated") ||
        message.includes("activated tag")
      ) {
        navigate("/fan/claimed", { replace: true, state: { tagId } });
        return;
      }

      if (message.includes("invalid objectid")) {
        sessionStorage.removeItem("tapToken");
        localStorage.removeItem("ownerToken");
        setApiError(
          "Something went wrong with your session. Please tap your merch again to restart.",
        );
        setLoading(false);
        return;
      }

      // Duplicate key
      if (message.includes("e11000") || message.includes("duplicate key")) {
        const dupFieldErrors = {};
        if (message.includes("email")) {
          dupFieldErrors.email = "This email is already registered.";
        }
        if (message.includes("phone")) {
          dupFieldErrors.phone = "This phone number is already registered.";
        }
        if (Object.keys(dupFieldErrors).length > 0) {
          setFieldErrors(dupFieldErrors);
        }
        setApiError(parseErrorMessage(err));
        setLoading(false);
        return;
      }

      setApiError(parseErrorMessage(err));
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
          <div
            className={`flex items-stretch input-field p-0 overflow-hidden ${
              fieldErrors.phone ? "border-red-500 focus-within:ring-red-500" : ""
            }`}
          >
            <span className="flex items-center px-3 bg-gray-50 text-gray-700 font-medium border-r border-gray-200 select-none">
              {PHONE_PREFIX}
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              className="flex-1 bg-transparent outline-none px-3 py-2"
              placeholder="8021234567"
              value={phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={loading || success}
            />
          </div>
          {renderError("phone")}
        </div>

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