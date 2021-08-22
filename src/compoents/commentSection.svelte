<script>
    import { flip } from "svelte/animate";

    async function fetchData(route, mycallback) {
        try {
            const dataRecived = await axios.get(route);
            mycallback(dataRecived.data);
        } catch (error) {
            console.log(error);
        }
    }

    async function postData(route, dataToSend) {
        try {
            const data = await axios.post(route, dataToSend);
        } catch (error) {
            console.log(error.response.data.msg);
        }
    }

    async function deleteData(route, dataToSend) {
        try {
            const data = await axios.delete(route, dataToSend);
        } catch (error) {
            console.log(error.response.data.msg);
        }
    }

    function Comment(commenterName, commentContent) {
        this.commenterName = commenterName;
        this.commentContent = commentContent;
        this.timeOfPost = Date.now();
        this.ip_adress = "";
        this.platform_info = window.navigator.userAgent;
    }

    let charactor;
    let comments = [];
    let commentRoute = "/data/comments";

    function updateComments() {
        fetchData(commentRoute, makeListFromDb_storeToLocal);
    }

    function initCommentsFromLocal() {
        let localComments = localStorage.getItem("comments");
        if (localComments == null) {
            return;
        } else {
            makeListFromDb_storeToLocal(JSON.parse(localComments));
        }
    }

    async function postComment() {
        let commentContent = document.getElementById(
            "commentSectionInput"
        ).value;
        let commenterName = charactor;

        if (commentContent == "") {
            return;
        }

        let the_comment = new Comment(commenterName, commentContent);

        comments.unshift(the_comment);
        makeListFromDb_storeToLocal(comments);

        postData(commentRoute, the_comment);
        document.getElementById('commentSectionInput').value = ''
        updateComments();
    }

    function removeComment(commentTimeOfPost) {
        makeListFromDb_storeToLocal(
            comments.filter((c) => c.timeOfPost !== commentTimeOfPost)
        );

        let deleteQuery = { timeOfPost: commentTimeOfPost };

        deleteData(commentRoute, { data: deleteQuery });
        updateComments();
    }

    function makeListFromDb_storeToLocal(data) {
        comments = data.slice();

        localStorage.setItem("comments", JSON.stringify(comments));
    }

    function generateRandomCharactor() {
        let names = [
            "🐶",
            "🐱",
            "🐭",
            "🐰",
            "🦊",
            "🐻",
            "🐼",
            "🐻‍❄️",
            "🐨",
            "🐯",
            "🦁",
            "🐮",
            "🐷",
        ];
        let new_charactor = names[Math.floor(Math.random() * names.length)];
        if (new_charactor == charactor) {
            generateRandomCharactor();
        }
        return new_charactor;
    }

    function changeCharactor() {
        let new_charactor = generateRandomCharactor();
        charactor = new_charactor;
        localStorage.setItem("charactor", new_charactor);
    }

    function getLocalCharactor() {
        return localStorage.getItem("charactor");
    }

    function initCharactor() {
        let storedCharactor = getLocalCharactor();
        if (storedCharactor == null) {
            changeCharactor();
        } else {
            charactor = storedCharactor;
        }
    }

    function getTimeElapsed(time) {
        let timeElapsed = (Date.now() - time) * 0.001; //in sec
        if (timeElapsed < 2) {
            return "now";
        } else if (timeElapsed < 60) {
            timeElapsed = Math.round(timeElapsed) + " s";
        } else if (timeElapsed < 3600) {
            timeElapsed = Math.round(timeElapsed / 60) + " mins";
        } else if (timeElapsed < 3600 * 24) {
            timeElapsed = Math.round(timeElapsed / 3600) + " hrs";
        } else if (timeElapsed < 3600 * 24 * 365.25) {
            timeElapsed = Math.round(timeElapsed / 3600 / 24) + " days";
        } else {
            timeElapsed =
                Math.round(timeElapsed / 3600 / 24 / 365.25) + " years";
        }
        return timeElapsed;
    }

    function init() {
        initCharactor();
        initCommentsFromLocal();
        updateComments();
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === 'Enter') {
            postComment();
        }
    });
</script>

<svelte:head>
    <script
        src="https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js"
        integrity="sha512-bZS47S7sPOxkjU/4Bt0zrhEtWx0y0CRkhEp8IckzK+ltifIIE9EMIMTuT/mEzoIMewUINruDBIR/jJnbguonqQ=="
        crossorigin="anonymous"
        on:load={init}></script>
</svelte:head>

<div id="commentSection" class="cardLike">
    {#if charactor}
        <span id="commentSectionName">
            {charactor}
        </span>
    {/if}

    <input
        type="text"
        id="commentSectionInput"
        class="cardLike"
        placeholder="Say whatever you want"
    />

    <div id="commentSectionButtons">
        <button on:click={changeCharactor} class="cardLike"
            >Change Charactor</button
        >
        <button on:click={postComment} class="cardLike">Post!</button>
    </div>

    <table id="commentsList">
        {#each comments as { commenterName, commentContent, timeOfPost } (timeOfPost)}
            <tr
                class="commentRow"
                animate:flip
                on:click={removeComment(timeOfPost)}
            >
                <td class="nameCell">{commenterName}</td>
                <td class="contentCell">{commentContent}</td>
                <td class="infoCell">{getTimeElapsed(timeOfPost)}</td>
            </tr>
        {/each}
    </table>
</div>

<style>
    #commentSection {
        max-width: 400px;
        min-width: 260px;
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;

        overflow: auto;
        overflow-x: hidden;
        max-height: 1000px;
        background-color: rgb(249, 250, 251);
        margin: 10px;
    }

    .nameCell {
        font-size: 30px;
        width: 30px;
    }

    .infoCell {
        color: gray;
        font-size: 11px;
        text-align: right;
        width: 4em;
    }

    .contentCell {
        font-size: medium;
        font-weight: 400;
    }

    #commentsList {
        border-collapse: separate;
        border-spacing: 1em 1em;
        width: 100%;
        table-layout: fixed;
    }

    #commentSectionName {
        font-size: 50px;
    }

    #commentSectionInput {
        width: 80%;
    }

    #commentSectionButtons > button {
        border: none;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        transition: box-shadow 0.3s ease-in-out;
        color: rgba(59, 59, 59, 0.767);
        cursor: pointer;
        font-size: small;
        font-weight: 700;
        padding: 9px;
        margin: 10px 5px;
        border-radius: 100px;
    }

    #commentSectionButtons > button:active {
        box-shadow: none;
    }

    #commentSection > input {
        -webkit-appearance: none;
        box-shadow: inset 3px 3px 7px 0 rgba(0, 0, 0, 0.2),
            -4px -4px 9px 0 rgba(255, 255, 255, 0.55);
        border: none;
        text-decoration: none;
        display: inline-block;
        color: rgba(59, 59, 59, 0.767);
        cursor: pointer;
        padding: 9px;
        margin: 6.5px;
        font-size: 100%;
        border-radius: 10px;
    }

    @media only screen and (max-width: 650px) {
        #commentSection {
            max-width: 100%;
            margin: 10px 0;
        }
    }
</style>
