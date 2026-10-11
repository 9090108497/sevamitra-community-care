# CareTriage AI

A React/Vite prototype for a community-health symptom intake and referral workflow, based on the CareTriage AI specification.

## Run locally

```sh
npm install
npm run dev
```

## Deploy with GitHub Pages

Create a GitHub repository and push this project to its `main` branch. The included
GitHub Actions workflow builds and publishes the site to GitHub Pages. The public
URL is `https://<your-github-username>.github.io/<repository-name>/` (or
`https://<your-github-username>.github.io/` if the repository is named
`<your-github-username>.github.io`). GitHub Pages deployment makes this prototype
public; its demo accounts and client-side data are not suitable for real patient
information.

## Demo roles

Create an account from the sign-in screen. Patient accounts do not need an access code. Staff sign-up uses these prototype codes:

- ASHA worker: `ASHA-CARE26`
- Doctor: `DOCTOR-CARE26`

Select the matching role when signing in. Patients only get the patient portal; ASHA workers get their patient-registration workspace; doctors get the review queue and referral list. A submitted case is stored in the browser and can be reviewed after signing in as a doctor in the same browser.

## Included prototype flows

- Role-specific sign-up and sign-in, with staff-code checks.
- Patient symptom check and ASHA patient registration.
- Optional browser speech-to-text symptom entry in English, Hindi, Bengali, and Odia, with typed-input fallback.
- Rule-based urgency suggestions and symptom-keyword specialist suggestions.
- Optional oxygen saturation and heart-rate intake.
- Patient access to nearby hospitals, clinics, and public health centres through Google Maps, using an explicitly requested browser location or a manually entered area.
- Doctor-prioritized case queue, review status, clinician-entered test and medicine orders, and digital referral IDs.
- A patient-facing care-plan section for tests and medicines saved by a doctor.
- Separate patient, ASHA, and doctor dashboard components.

## Important limitations

This is a front-end demonstration, not a production health system. Accounts and cases are stored in browser `localStorage`; the staff codes are public in the client; and role separation is not enforced by a server. Voice recognition is provided by the browser and may require microphone permission and internet access. Do not enter real patient data. A production deployment needs server-side authentication and authorization, secure health-data storage and audit logs, and clinical validation of all triage and referral rules.

Nearby-facility searches open Google Maps in a new tab. Browser location is requested only when the user chooses it, held only in page memory, and included in the Maps search URL; users can search by area instead. Maps results and facility availability may be incomplete or out of date, so confirm services and hours directly before travelling.

Triage suggestions are illustrative rules only. They are not diagnoses or treatment advice; a qualified clinician must make clinical decisions. The application does not generate medicine or test recommendations: the doctor enters any orders shown to the patient. For emergencies, seek immediate local medical care.
