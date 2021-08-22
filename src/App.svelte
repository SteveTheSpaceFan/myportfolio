<script>
	import { fade } from "svelte/transition";
	import Header from "./header/header.svelte";
	import ProjectSectiom from "./compoents/projectSection.svelte";
	import CommentSection from "./compoents/commentSection.svelte";
	import IntroSection from "./compoents/introSection.svelte";
</script>

<svelte:head>
	<title>Steve's</title>

	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@300&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<main in:fade>
	<Header />
	<div id="compoents">
		<CommentSection />
		<ProjectSectiom />
		<IntroSection />
	</div>
</main>

<style>
	:global(body) {
		margin: 0px;
		padding: 0px;
	}

	:global(.cardLike) {
		border: none;
		box-shadow: 3px 3px 7px 0 rgba(0, 0, 0, 0.2),
			-4px -4px 9px 0 rgba(255, 255, 255, 0.55);
		background-color: transparent;
		border-radius: 10px;
	}

	main {
		font-family: "Inter", sans-serif;
	}

	#compoents {
		display: flex;
		flex-direction: row;
		justify-content: space-around;
		align-content: stretch;
		margin: 10px 10px;
		flex-wrap: wrap;
	}

	@media only screen and (max-width: 650px) {
		#compoents {
			flex-direction: column;
		}
	}
</style>
