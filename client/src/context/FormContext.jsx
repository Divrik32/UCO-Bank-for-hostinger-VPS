import { createContext, useContext, useState } from "react";

const FormContext = createContext();

export function FormProvider({ children }) {
  const [formData, setFormData] = useState({
    personalInfo: {},
    kycInfo: {},
    bankInfo: {},
    nomineeInfo: {},
  });

  const updateSection = (section, data) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  };

  return (
    <FormContext.Provider value={{ formData, updateSection }}>
      {children}
    </FormContext.Provider>
  );
}

export const useFormData = () => useContext(FormContext);