import { createContext, useContext } from 'react';
export const CaptureRouter = createContext<any>(null);
export const useRouter = () => useContext(CaptureRouter);
