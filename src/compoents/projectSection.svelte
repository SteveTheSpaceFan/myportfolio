<script>
    let projects = [];
    function Project(name, detail, link, imgsrc) {
        this.name = name;
        this.detail = detail;
        this.link = link;
        this.imgsrc = imgsrc;
    }
    projects.push(
        new Project(
            "StarShip Simulator",
            "This is a cross-platform game and literally support any device that is able to connect to Internet, and also can be played offline ( If you are interested, this is actually a PWA (Progressive Web App), which means that it is also installable on almost any device and can work like regular apps)",
            "http://www.pornhub.com",
            "https://i.ibb.co/ThTzJdC/Screen-Shot-2021-08-12-at-1-29-35-PM.png"
        )
    );

    for(let n=0;n<3;n++){
        projects.push(
        new Project(
            "StarShip Simulator",
            "apps)",
            "",
            "https://i.ibb.co/ThTzJdC/Screen-Shot-2021-08-12-at-1-29-35-PM.png"
        )
    );
    }
    
</script>

<div id="projectSection" class="cardLike">
    <p style="margin-left: 20px;">My Projects</p>

    {#each projects as { name, detail, link, imgsrc }, i}
        <div class="cardLike project">
            <div class="projectDescription">
                <span class="projectName">{name}</span><br />
                <span class="projectDetail">{detail}</span><br />
                <a href={link} class="projectLink">GitHub</a>
            </div>
            <img
                class="projectImg"
                loading="lazy"
                src={imgsrc}
                alt="ProjectImage"
            />
        </div>
    {/each}
</div>

<style>
    #projectSection {
        min-width: 18em;
        max-width: 450px;
        flex: 3;

        overflow: auto;
        max-height: 1000px;
        background-color: rgb(249, 250, 251);
        margin: 10px;
    }

    .project {
        padding: 10px;
        display: flex;
        justify-content: space-between;
        align-content: stretch;
        height: 10em;
        margin: 20px 10px;
    }

    .projectDescription {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-width: 5em;
        margin-right: 10px;
    }

    .projectName {
        font-size: larger;
    }

    .projectDetail {
        font-size: small;
        overflow: auto;
        font-weight: 300;
    }

    .projectLink {
        font-size: large;
        text-decoration: none;
    }

    .projectImg {
        border-radius: 10px;
        width: 10em;
        height: 10em;
        object-fit: cover;
    }

    
    @media only screen and (max-width: 650px) {
        #projectSection {
            max-width: 4500px;
            margin: 10px 0;
            max-height: 50000px;
        }
    }
</style>
