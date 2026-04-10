import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/your_repo_name_here/', // Make sure to replacce with your github.com/User_Name/Repo_Name, only after User_Name/
});
