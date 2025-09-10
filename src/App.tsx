import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router";

import SearchPageExperience from "./experiences/search-page";
import PopSearchExperience from "./experiences/pop-search";

import "./App.css";

function Landing() {
	return (
		<div className="qs-landing">
			<header className="qs-landing-header">
				<h1>Quick Search Experiments</h1>
				<p>Pick an experience to explore.</p>
			</header>

			<div className="qs-landing-grid">
				<article className="qs-card">
					<h2>Search Page</h2>
					<p>A full page with search components displayed together.</p>
					<Link className="qs-button" to="/search-page">Open</Link>
				</article>

				<article className="qs-card">
					<h2>Pop Search</h2>
					<p>A compact button that opens search in a modal.</p>
					<Link className="qs-button" to="/pop-search">Open</Link>
				</article>
			</div>
		</div>
	);
}

function ExperienceLayout({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="qs-experience-layout">
			<nav className="qs-topbar">
				<span className="qs-topbar-title">{title}</span>
				<Link className="qs-back" to="/">return to home</Link>
			</nav>
			<div className="qs-experience-content">{children}</div>
		</div>
	);
}

export default function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Landing />} />
				<Route
					path="/search-page"
					element={
						<ExperienceLayout title="Search Page">
							<SearchPageExperience />
						</ExperienceLayout>
					}
				/>
				<Route
					path="/pop-search"
					element={
						<ExperienceLayout title="Pop Search">
							<PopSearchExperience />
						</ExperienceLayout>
					}
				/>
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}


