import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import '/assets/vendor/bootstrap/css/bootstrap.min.css'
// import '/assets/vendor/bootstrap-icons/bootstrap-icons.css'
// import '/assets/css/style1.css'
import { FormProvider } from "./context/FormContext";


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FormProvider>
        <App />
    </FormProvider>
  </StrictMode>,
)