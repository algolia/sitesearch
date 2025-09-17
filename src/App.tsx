import React from "react";

import SearchExperience from "./experiences/pop-search";

import "./App.css";
import "./experiences/pop-search/index.css";

function Landing() {
	return (
		<div className="qs-landing">
			<header className="qs-landing-header">
				<h1>Search Experiments</h1>
				<p>Pick an experience to explore.</p>
			</header>

			<div className="qs-landing-grid">
				<article className="qs-card">
					<h2>Pop Search</h2>
					<p>A compact button that opens search in a modal.</p>
					<div className="qs-modal-demo">
						<SearchExperience />
					</div>
				</article>
			</div>
		</div>
	);
}



export default function App() {
	return (
		<Landing />
	);
}


