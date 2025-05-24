import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";

// Create a client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			cacheTime: 1000 * 60 * 10, // 10 minutes
			refetchOnWindowFocus: false,
			retry: (failureCount, error) => {
				if (error.status === 404 || error.status === 403) {
					return false;
				}
				return failureCount < 2;
			},
		},
		mutations: {
			retry: false,
		},
	},
});

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BrowserRouter>
			<QueryClientProvider client={queryClient}>
				<App />
				<Toaster
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							background: "#363636",
							color: "#fff",
						},
						success: {
							style: {
								background: "#10b981",
							},
						},
						error: {
							style: {
								background: "#ef4444",
							},
						},
					}}
				/>
			</QueryClientProvider>
		</BrowserRouter>
	</React.StrictMode>
);
