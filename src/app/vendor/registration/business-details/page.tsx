"use client";
import { useState, ChangeEvent, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import QuoteBlock from "@/components/quotes";
import { AppDispatch } from "@/store";
import { updateVendorBusiness } from "@/store/slices/vendorSlice";
import {
  BUSINESS_NATURES, BUSINESS_TYPES, CATEGORIES, COUNTRIES, INDIAN_STATES,
  validateGST, validatePAN, validatePhone, validatePincode,
  validateIFSC, validateAccount, validateUPI, ESTABLISHED_YEAR,
  ANNUAL_TURNOVER, DEALING_AREA, NUMBER_OF_EMPLOYEES,
  OPERATING_HOURS, RETURN_POLICY, BANK_NAMES,
} from "@/lib/constants";
import PromotionalBanner from "@/components/promotional-banner";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer";

// OPTIMIZATION: Memoized input component to prevent re-renders
const TextInput = memo(({
  name, label, value, placeholder, disabled, error,
  onChange, onBlur, onPaste, toUpperCase, capitalize
}: any) => {
  const toTitleCase = (input: string) => input.replace(/\b[a-z]/g, (char) => char.toUpperCase());

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (toUpperCase) val = val.toUpperCase();
    else if (capitalize) val = toTitleCase(val);
    onChange(name, val);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Input
        name={name}
        value={value}
        disabled={disabled}
        onChange={handleChange}
        onBlur={() => onBlur(name)}
        onPaste={onPaste}
        placeholder={placeholder || label}
      />
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
});

// OPTIMIZATION: Memoized select component
const SelectInput = memo(({ name, label, value, options, error, onChange }: any) => {
  const [query, setQuery] = useState("");
  const filteredOptions = options.filter((opt: string) =>
    opt.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    setQuery("");
  }, [value]);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <Select value={value} onValueChange={(val) => onChange(name, val)}>
        <SelectTrigger><SelectValue placeholder={`Select ${label}`} /></SelectTrigger>
        <SelectContent className="space-y-1">
          <div className="px-3 pt-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full"
            />
          </div>
          <div className="max-h-60 overflow-auto pb-2">
            {!filteredOptions.length && (
              <div className="px-3 py-2 text-xs text-muted-foreground">Nothing found</div>
            )}
            {filteredOptions.map((opt: string) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </div>
        </SelectContent>
      </Select>
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
});

// OPTIMIZATION: Memoized file input
const FileInput = memo(({ name, label, error, onChange }: any) => (
  <div>
    <label className="block text-sm font-medium mb-1">{label}</label>
    <Input type="file" name={name} onChange={onChange} accept=".pdf,.jpg,.jpeg,.png" />
    {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
  </div>
));

// ✅ Multi Select with removable chips
const MultiSelectInput = memo(
  ({ name, label, options, values, error, onChange }: any) => {
    const [query, setQuery] = useState("");
    const filteredOptions = options.filter((opt: string) =>
      opt.toLowerCase().includes(query.toLowerCase()),
    );

    const handleSelect = (value: string) => {
      if (!values.includes(value)) {
        onChange(name, [...values, value]);
      }
    };

    const handleRemove = (value: string) => {
      onChange(
        name,
        values.filter((v: string) => v !== value)
      );
    };

    useEffect(() => {
      setQuery("");
    }, [values]);

    return (
      <div>
        <label className="block text-sm font-medium mb-1">{label}</label>

        <Select onValueChange={handleSelect}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent className="space-y-1">
          <div className="px-3 pt-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full"
            />
          </div>
          <div className="max-h-60 overflow-auto pb-2">
            {!filteredOptions.length && (
              <div className="px-3 py-2 text-xs text-muted-foreground">Nothing found</div>
            )}
            {filteredOptions.map((opt: string) => (
              <SelectItem
                key={opt}
                value={opt}
                disabled={values.includes(opt)}
              >
                {opt}
              </SelectItem>
            ))}
          </div>
        </SelectContent>
        </Select>

        {/* Selected chips */}
        {values.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {values.map((val: string) => (
              <span
                key={val}
                className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
              >
                {val}
                <button
                  type="button"
                  onClick={() => handleRemove(val)}
                  className="text-blue-600 hover:text-red-600"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
      </div>
    );
  }
);


export default function BusinessDetails() {
  const router = useRouter();
  const dispatch = useDispatch<any>();

  // OPTIMIZATION: Only select what you need from Redux
  const loading = useSelector((state: any) => state.vendor?.loading);
  const token = useSelector((state: any) => state.auth?.token);

  const [form, setForm] = useState({
    registrar_name: "", email: "", phone_no: "", name: "", business_type: "",
    gst_number: "", pan_number: "", alternate_contact_name: "",
    alternate_contact_phone: "", address_line_1: "", address_line_2: "",
    street: "", city: "", state: "", pincode: "", country: "India",
    bank_name: "", bank_account: "", ifsc_code: "", branch: "", upi_id: "",
    categories: [] as string[],
    return_policy: "", operating_hours: "",
    established_year: "", business_nature: "", annual_turnover: "",
    dealing_area: "", office_employees: "",
    gst_cert: null as File | null, pan_card: null as File | null,
    avatar: null as File | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("vendor_email") || "";
    const storedPhone = sessionStorage.getItem("vendor_phone") || "";
    setForm((prev) => ({ ...prev, email: storedEmail, phone_no: storedPhone }));
  }, []);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  // OPTIMIZATION: Single update function with no validation during typing
  const updateField = useCallback((name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);


  const handleSelectChange = useCallback((name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }, []);

  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files?.[0]) {
      const file = files[0];
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({ ...prev, [name]: "Only PDF, JPG, or PNG allowed." }));
        return;
      }
      setForm((prev) => ({ ...prev, [name]: file }));
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  }, []);

  const handleAvatarChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setForm((prev) => ({ ...prev, avatar: null }));
      setAvatarPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setErrors((prev) => {
        const next = { ...prev };
        delete next.avatar;
        return next;
      });
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrors((prev) => ({ ...prev, avatar: "Only image files are allowed." }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return previewUrl;
    });
    setForm((prev) => ({ ...prev, avatar: file }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.avatar;
      return next;
    });
  }, []);

  // OPTIMIZATION: Validate only on blur
  const handleBlur = useCallback((name: string) => {
    const value = form[name as keyof typeof form] as string;
    let error = "";

    switch (name) {
      case "gst_number":
        if (value && !validateGST(value)) error = "Invalid GST format";
        break;
      case "pan_number":
        if (value && !validatePAN(value)) error = "Invalid PAN format";
        break;
      case "phone_no":
      case "alternate_contact_phone":
        if (value && !validatePhone(value)) error = "Invalid phone number";
        break;
      case "pincode":
        if (value && !validatePincode(value)) error = "Invalid pincode";
        break;
      case "ifsc_code":
        if (value && !validateIFSC(value)) error = "Invalid IFSC code";
        break;
      case "bank_account":
        if (value && !validateAccount(value)) error = "Invalid account number";
        break;
      case "upi_id":
        if (value && !validateUPI(value)) error = "Invalid UPI ID";
        break;
      case "email":
        if (value && !/^\S+@\S+\.\S+$/.test(value)) error = "Invalid email";
        break;
      case "categories":
        if (!form.categories.length) error = "Select at least one category";
        break;
      default:
        if (!value && name !== "address_line_2") error = "This field is required";
    }

    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[name] = error;
      } else {
        delete next[name];
      }
      return next;
    });
  }, [form]);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.keys(form).forEach((key) => {
      const value = form[key as keyof typeof form];
      if (
        key !== "address_line_2" &&
        key !== "gst_cert" &&
        key !== "pan_card" &&
        key !== "avatar" &&
        !value
      ) {
        newErrors[key] = "This field is required";
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    if (!token) {
      Swal.fire({ icon: "warning", title: "Unauthorized", text: "Please login first!" });
      setIsSubmitting(false);
      return;
    }

    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value) data.append(key, value as any);
      });
      const result = await dispatch(updateVendorBusiness({ formData: data }));

      console.log("Update dispatch result:", result);
      if (updateVendorBusiness.fulfilled.match(result)) {
        const successMessage =
          (result.payload as any)?.message ||
          "Your business details have been saved successfully.";
        Swal.fire({
          icon: "success",
          title: "Business Updated!",
          text: successMessage,
          timer: 2000,
          showConfirmButton: false,
        });
        router.push("/vendor/registration/thankyou");
      } else {
        Swal.fire({
          icon: "error", title: "Error",
          text: (result.payload as string) || "Failed to update business details.",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Unexpected Error", text: "Something went wrong." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PromotionalBanner />
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
        <QuoteBlock />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto"
        >
          <Card className="shadow-xl">
            <CardHeader className="">
              <CardTitle className="text-3xl">Business Details</CardTitle>
              <p className="">Fill in your business information to complete registration.</p>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {/* Your Information */}
              <Card>
                <CardHeader><CardTitle>Your Information</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <TextInput name="registrar_name" label="Your Name" value={form.registrar_name}
                    onChange={updateField} onBlur={handleBlur} error={errors.registrar_name} capitalize />
                  <div>
                    <TextInput name="email" label="Email" value={form.email} disabled
                      onChange={updateField} onBlur={handleBlur} error={errors.email} />
                    <p className="text-xs text-gray-500 mt-1">Can't edit</p>
                  </div>
                  <div>
                    <TextInput name="phone_no" label="Phone No" value={form.phone_no} disabled
                      placeholder="10-digit number" onChange={updateField} onBlur={handleBlur} error={errors.phone_no} />
                    <p className="text-xs text-gray-500 mt-1">Can't edit</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <div className="h-24 w-24 rounded-full border border-dashed border-gray-300 bg-white overflow-hidden">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            No photo
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Input type="file" accept="image/*" onChange={handleAvatarChange} />
                        <p className="text-xs text-gray-500">JPG, PNG, or WEBP up to 5MB</p>
                        {errors.avatar && <div className="text-red-500 text-xs">{errors.avatar}</div>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader><CardTitle>Business Information</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <TextInput name="name" label="Business Name" value={form.name}
                    onChange={updateField} onBlur={handleBlur} error={errors.name} capitalize />
                  <SelectInput name="business_type" label="Business Type" value={form.business_type}
                    options={BUSINESS_TYPES} onChange={handleSelectChange} error={errors.business_type} />
                  <TextInput name="gst_number" label="GST Number" value={form.gst_number}
                    placeholder="e.g. 22AAAAA0000A1Z5" onChange={updateField} onBlur={handleBlur} error={errors.gst_number} toUpperCase />
                  <TextInput name="pan_number" label="PAN Number" value={form.pan_number}
                    placeholder="e.g. ABCDE1234F" onChange={updateField} onBlur={handleBlur} error={errors.pan_number} toUpperCase />
                  <TextInput name="alternate_contact_name" label="Alternate Contact Name" value={form.alternate_contact_name}
                    onChange={updateField} onBlur={handleBlur} error={errors.alternate_contact_name} capitalize />
                  <TextInput name="alternate_contact_phone" label="Alternate Contact Phone" value={form.alternate_contact_phone}
                    placeholder="10-digit number" onChange={updateField} onBlur={handleBlur} error={errors.alternate_contact_phone} />
                </CardContent>
              </Card>

              {/* Business Profile */}
              <Card>
                <CardHeader><CardTitle>Business Profile</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <SelectInput name="established_year" label="Established Year" value={form.established_year}
                    options={ESTABLISHED_YEAR} onChange={handleSelectChange} error={errors.established_year} />
                  <SelectInput name="business_nature" label="Business Nature" value={form.business_nature}
                    options={BUSINESS_NATURES} onChange={handleSelectChange} error={errors.business_nature} />
                  <SelectInput name="annual_turnover" label="Annual Turnover" value={form.annual_turnover}
                    options={ANNUAL_TURNOVER} onChange={handleSelectChange} error={errors.annual_turnover} />
                  <SelectInput name="dealing_area" label="Dealing Area" value={form.dealing_area}
                    options={DEALING_AREA} onChange={handleSelectChange} error={errors.dealing_area} />
                  <SelectInput name="office_employees" label="Number of Office Employees" value={form.office_employees}
                    options={NUMBER_OF_EMPLOYEES} onChange={handleSelectChange} error={errors.office_employees} />
                </CardContent>
              </Card>

              {/* Address Details */}
              <Card>
                <CardHeader><CardTitle>Address Details</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <TextInput name="address_line_1" label="Address Line 1" value={form.address_line_1}
                    onChange={updateField} onBlur={handleBlur} error={errors.address_line_1} capitalize />
                  <TextInput name="address_line_2" label="Address Line 2 (Optional)" value={form.address_line_2}
                    onChange={updateField} onBlur={handleBlur} error={errors.address_line_2} capitalize />
                  <TextInput name="street" label="Street" value={form.street}
                    onChange={updateField} onBlur={handleBlur} error={errors.street} capitalize />
                  <TextInput name="city" label="City" value={form.city}
                    onChange={updateField} onBlur={handleBlur} error={errors.city} capitalize />
                  <SelectInput name="state" label="State" value={form.state}
                    options={INDIAN_STATES} onChange={handleSelectChange} error={errors.state} />
                  <TextInput name="pincode" label="Pincode" value={form.pincode}
                    placeholder="6-digit code" onChange={updateField} onBlur={handleBlur} error={errors.pincode} />
                  <SelectInput name="country" label="Country" value={form.country}
                    options={COUNTRIES} onChange={handleSelectChange} error={errors.country} />
                </CardContent>
              </Card>

              {/* Bank Details */}
              <Card>
                <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <SelectInput name="bank_name" label="Bank Name" value={form.bank_name}
                    options={BANK_NAMES} onChange={handleSelectChange} error={errors.bank_name} />
                  <TextInput name="bank_account" label="Account Number" value={form.bank_account}
                    placeholder="9–18 digits" onChange={updateField} onBlur={handleBlur} error={errors.bank_account}
                  />
                  <TextInput name="ifsc_code" label="IFSC Code" value={form.ifsc_code}
                    placeholder="e.g. SBIN0002499" onChange={updateField} onBlur={handleBlur} error={errors.ifsc_code}
                    toUpperCase />
                  <TextInput name="branch" label="Branch Name" value={form.branch}
                    onChange={updateField} onBlur={handleBlur} error={errors.branch} capitalize />
                  <TextInput name="upi_id" label="UPI ID" value={form.upi_id}
                    placeholder="e.g. name@upi" onChange={updateField} onBlur={handleBlur} error={errors.upi_id} />
                </CardContent>
              </Card>

              {/* Other Information */}
              <Card>
                <CardHeader><CardTitle>Other Information</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <MultiSelectInput
                    name="categories"
                    label="Categories"
                    values={form.categories}
                    options={CATEGORIES}
                    onChange={updateField}
                    error={errors.categories}
                  />

                  <SelectInput name="return_policy" label="Return Policy" value={form.return_policy}
                    options={RETURN_POLICY} onChange={handleSelectChange} error={errors.return_policy} />
                  <SelectInput name="operating_hours" label="Operating Hours" value={form.operating_hours}
                    options={OPERATING_HOURS} onChange={handleSelectChange} error={errors.operating_hours} />
                </CardContent>
              </Card>

              {/* Documents */}
              <Card>
                <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <FileInput name="gst_cert" label="GST Certificate (PDF/JPG/PNG)"
                    onChange={handleFileChange} error={errors.gst_cert} />
                  <FileInput name="pan_card" label="PAN Card (PDF/JPG/PNG)"
                    onChange={handleFileChange} error={errors.pan_card} />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={loading || isSubmitting}
                  className="bg-black px-8 py-3">
                  {loading || isSubmitting ? "Saving..." : "Complete Registration"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}
