"use client";

import { useEffect } from "react";

/**
 * Localizes native HTML5 form-validation messages to Spanish.
 *
 * The browser shows validation bubbles ("Please fill out this field.") in the
 * browser's UI language, not the page language, so setting <html lang> is not
 * enough. We intercept the `invalid` event (which does NOT bubble, hence the
 * capture-phase document listener) and replace the message via setCustomValidity,
 * clearing it again on input so the field can become valid.
 */
export default function FormLocalization() {
  useEffect(() => {
    const messageFor = (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string => {
      const v = el.validity;
      if (v.valueMissing) {
        if (el instanceof HTMLSelectElement) return "Por favor, seleccioná una opción.";
        if ((el as HTMLInputElement).type === "checkbox" || (el as HTMLInputElement).type === "radio")
          return "Por favor, marcá esta casilla si querés continuar.";
        return "Por favor, completá este campo.";
      }
      if (v.typeMismatch) {
        const type = (el as HTMLInputElement).type;
        if (type === "email") return "Ingresá un correo electrónico válido.";
        if (type === "url") return "Ingresá una URL válida (por ejemplo, https://…).";
        return "El valor ingresado no tiene el formato correcto.";
      }
      const input = el as HTMLInputElement;
      if (v.tooShort) return `Debe tener al menos ${input.minLength} caracteres.`;
      if (v.tooLong) return `Debe tener como máximo ${input.maxLength} caracteres.`;
      if (v.rangeUnderflow) return `El valor debe ser mayor o igual a ${input.min}.`;
      if (v.rangeOverflow) return `El valor debe ser menor o igual a ${input.max}.`;
      if (v.stepMismatch) return "El valor ingresado no es válido.";
      if (v.patternMismatch) return "El formato ingresado no es válido.";
      if (v.badInput) return "Revisá el valor ingresado.";
      return "El valor ingresado no es válido.";
    };

    const onInvalid = (e: Event) => {
      const el = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (el && typeof (el as any).setCustomValidity === "function") {
        el.setCustomValidity(messageFor(el));
      }
    };

    // Clear the custom message so the field can be re-validated on the next attempt.
    const onInputOrChange = (e: Event) => {
      const el = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
      if (el && typeof (el as any).setCustomValidity === "function") {
        el.setCustomValidity("");
      }
    };

    document.addEventListener("invalid", onInvalid, true);
    document.addEventListener("input", onInputOrChange, true);
    document.addEventListener("change", onInputOrChange, true);
    return () => {
      document.removeEventListener("invalid", onInvalid, true);
      document.removeEventListener("input", onInputOrChange, true);
      document.removeEventListener("change", onInputOrChange, true);
    };
  }, []);

  return null;
}
