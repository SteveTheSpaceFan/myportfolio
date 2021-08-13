function Comment(commenterName, commentContent) {
    this.commenterName = commenterName
    this.commentContent = commentContent
    this.timeOfPost = Date.now()
    this.ip_adress = ""
    this.platform_info = window.navigator.userAgent
}

let charactor
let comments = []
let commentRoute = "/data/comments"

initCharactor()
initCommentsFromLocal()
updateComments()

/*setInterval(() => {
    updateComments()
}, 5000);*/

function updateComments() {
    fetchData(commentRoute, makeListFromDb_storeToLocal)    
}

function initCommentsFromLocal() {
    let localComments = localStorage.getItem("comments");
    if(localComments == null){
        return
    }else{
        makeListFromDb_storeToLocal(JSON.parse(localComments))
    }
}

function saveCommentsToLocal(comments) {
    localStorage.setItem("comments", comments);
}

function postComment() {
    let commentContent = document.getElementById('commentSectionInput').value
    let commenterName = charactor

    if (commentContent == '') {
        return
    }

    let the_comment = new Comment(commenterName, commentContent)

    postData(commentRoute, the_comment)

    document.getElementById('commentSectionInput').value = ''
    updateComments()
}

function makeListFromDb_storeToLocal(data) {

    let commentsListnode = document.getElementById('commentsList')

    comments = data.slice()

    localStorage.setItem("comments", JSON.stringify(comments));

    drawMessageList(commentsListnode, comments)

    function drawMessageList(node, content) {
        let stuffToBeDraw = content.slice()

        clearAllSubNodes(node)
        drawList(node, stuffToBeDraw)

        function clearAllSubNodes(node) {
            while (node.firstChild) {
                node.removeChild(node.lastChild);
            }
        }
        function drawList(node, content) {
            if (content.length != 0) {
                drawRow(content.shift())
                drawList(node, content)
            }

            function drawRow(message) {
                let row = node.insertRow(-1);
                row.className = 'messageRow'
                let contentCell = row.insertCell(0);
                contentCell.className = 'contentCell'
                let infoCell = row.insertCell(1);
                infoCell.className = 'infoCell'
                contentCell.innerHTML = generateCommentContent(message);
                infoCell.innerHTML = generateCommentInfo(message);

                function generateCommentContent(comment) {
                    let commentContent = comment.commenterName + " " + comment.commentContent
                    return commentContent

                }
                function generateCommentInfo(comment) {
                    let timeElapse = getTimeElapsed(comment)
                    let commentInfo = timeElapse
                    return commentInfo

                    function getTimeElapsed(comment) {
                        let timeElapsed = (Date.now() - comment.timeOfPost) * 0.001 //in sec
                        if (timeElapsed < 2) {
                            return "now"
                        } else if (timeElapsed < 60) {
                            timeElapsed = Math.round(timeElapsed) + ' s'
                        } else if (timeElapsed < 3600) {
                            timeElapsed = Math.round(timeElapsed / 60) + ' mins'
                        } else if (timeElapsed < 3600 * 24) {
                            timeElapsed = Math.round(timeElapsed / 3600) + ' hrs'
                        } else if (timeElapsed < 3600 * 24 * 365.25) {
                            timeElapsed = Math.round(timeElapsed / 3600 / 24) + ' days'
                        } else {
                            timeElapsed = Math.round(timeElapsed / 3600 / 24 / 365.25) + ' years'
                        }
                        return timeElapsed
                    }
                }
            }
        }
    }


}

function generateRandomCharactor() {
    let names = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐻‍❄️', '🐨', '🐯', '🦁', '🐮', '🐷'];
    let new_charactor = names[Math.floor(Math.random() * names.length)];
    if (new_charactor == charactor) {
        generateRandomCharactor()
    }
    return new_charactor
}

function changeCharactor() {
    let new_charactor = generateRandomCharactor()
    charactor = new_charactor
    document.getElementById('commentSectionName').innerHTML = new_charactor;
    localStorage.setItem("charactor", new_charactor);
}

function getLocalCharactor() {
    return localStorage.getItem("charactor");
}

function initCharactor() {
    let storedCharactor = getLocalCharactor()
    if (storedCharactor == null) {
        changeCharactor()
    } else {
        charactor = storedCharactor
        document.getElementById('commentSectionName').innerHTML = storedCharactor;
    }
}


