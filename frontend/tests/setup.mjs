// Contract tests use a simulated Axios adapter; no real backend is contacted.
process.env.NEXT_PUBLIC_API_BASE_URL = "https://backend.invalid/api/v1";
process.env.NEXT_PUBLIC_ENABLE_VAULT = "false";
