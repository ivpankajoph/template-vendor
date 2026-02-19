import { isEmpty, validateAccount, validateGST, validateIFSC, validatePAN, validatePhone, validatePincode, validateUPI } from "@/lib/constants";
import { useState, useEffect } from "react";


export type FormState = {
  name: string;
  business_type: string;
  gst_number: string;
  pan_number: string;
  alternate_contact_name: string;
  alternate_contact_phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  bank_name: string;
  bank_account: string;
  ifsc_code: string;
  branch: string;
  upi_id: string;
  categories: string;
  return_policy: string;
  operating_hours: string;
  gst_cert: File | null;
  pan_card: File | null;
};

export const useFormValidation = () => {
  const [form, setForm] = useState<FormState>({
    name: "",
    business_type: "",
    gst_number: "",
    pan_number: "",
    alternate_contact_name: "",
    alternate_contact_phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
    address: "",
    bank_name: "",
    bank_account: "",
    ifsc_code: "",
    branch: "",
    upi_id: "",
    categories: "",
    return_policy: "",
    operating_hours: "",
    gst_cert: null,
    pan_card: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTextInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    options?: { preventPaste?: boolean; toUpperCase?: boolean }
  ) => {
    let value = e.target.value;
    const { name } = e.target;

    if (options?.toUpperCase) {
      value = value.toUpperCase();
    }

    setForm({ ...form, [name]: value });

    if (touched[name] || isSubmitting) {
      validateField(name, value);
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
    if (touched[name] || isSubmitting) {
      validateField(name, value);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      const allowedTypes = ["application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, [name]: "Only PDF allowed." }));
        return;
      }
      setForm({ ...form, [name]: file });
      if (touched[name] || isSubmitting) {
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[name];
          return updated;
        });
      }
    }
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, form[name as keyof FormState] as string);
  };

  const validateField = (name: string, value: string) => {
    let error = "";

    switch (name) {
      case "name":
      case "alternate_contact_name":
      case "street":
      case "city":
      case "address":
      case "bank_name":
      case "branch":
      case "categories":
      case "return_policy":
      case "operating_hours":
        if (isEmpty(value)) error = `${name.replace(/_/g, " ")} is required.`;
        break;

      case "business_type":
      case "state":
        if (!value) error = `${name.replace(/_/g, " ")} is required.`;
        break;

      case "gst_number":
        if (isEmpty(value)) {
          error = "GST Number is required.";
        } else if (!validateGST(value)) {
          error = "Invalid GST format.";
        }
        break;

      case "pan_number":
        if (isEmpty(value)) {
          error = "PAN Number is required.";
        } else if (!validatePAN(value)) {
          error = "Invalid PAN format (e.g., ABCDE1234F).";
        }
        break;

      case "alternate_contact_phone":
        if (isEmpty(value)) {
          error = "Alternate Contact Phone is required.";
        } else if (!validatePhone(value)) {
          error = "Invalid 10-digit phone number.";
        }
        break;

      case "pincode":
        if (isEmpty(value)) {
          error = "Pincode is required.";
        } else if (!validatePincode(value)) {
          error = "Invalid pincode (6 digits, no leading zero).";
        }
        break;

      case "bank_account":
        if (isEmpty(value)) {
          error = "Account Number is required.";
        } else if (!validateAccount(value)) {
          error = "Account must be 9–18 digits.";
        }
        break;

      case "ifsc_code":
        if (isEmpty(value)) {
          error = "IFSC Code is required.";
        } else if (!validateIFSC(value)) {
          error = "Invalid IFSC code.";
        }
        break;

      case "upi_id":
        if (value && !validateUPI(value)) {
          error = "UPI ID must contain '@'.";
        }
        break;

      case "gst_cert":
        if (!form.gst_cert) error = "GST Certificate is required.";
        break;

      case "pan_card":
        if (!form.pan_card) error = "PAN Card is required.";
        break;

      default:
        break;
    }

    setErrors((prev) => {
      const updated = { ...prev };
      if (error) {
        updated[name] = error;
      } else {
        delete updated[name];
      }
      return updated;
    });
  };

  const validateForm = () => {
    setIsSubmitting(true);
    const newErrors: Record<string, string> = {};

    Object.keys(form).forEach((key) => {
      if (key === "gst_cert" || key === "pan_card") return;
      validateField(key, form[key as keyof FormState] as string);
    });

    if (!form.gst_cert) newErrors.gst_cert = "GST Certificate is required.";
    if (!form.pan_card) newErrors.pan_card = "PAN Card is required.";

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0 && Object.keys(errors).length === 0;
  };

  return {
    form,
    errors,
    touched,
    isSubmitting,
    handleTextInput,
    handleSelectChange,
    handleFileChange,
    handleBlur,
    validateForm,
    setForm,
  };
};