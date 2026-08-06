import {
  CONNECTION_ERROR_MESSAGE,
  isNetworkError,
} from "@/lib/network-error";

export function mapAuthError(message: string | undefined): string {
  if (!message) return "A apărut o eroare. Încearcă din nou.";
  if (isNetworkError(message)) return CONNECTION_ERROR_MESSAGE;
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Email sau parolă greșită.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirmă emailul înainte de autentificare.";
  }
  if (lower.includes("user already registered")) {
    return "Există deja un cont cu acest email.";
  }
  if (lower.includes("password should") || lower.includes("password is")) {
    return "Parola nu respectă cerințele de securitate.";
  }
  if (lower.includes("rate limit")) {
    return "Prea multe încercări. Așteaptă câteva minute.";
  }
  return message;
}
