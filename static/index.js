function logger(stuff) {
    console.log(stuff);
}

function makeList(node,content) {
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
            generateRow(node, content.shift())
            drawList(node, content)
        } else {
            console.log('done drawing');
        }

        function generateRow(node, content) {
            var li = document.createElement("li");
            li.appendChild(document.createTextNode(content));
            node.appendChild(li);
        }
    }
}


const fetchData = async (route, mycallback) => {
    try {
        const dataRecived = await axios.get(route)
        mycallback(dataRecived.data);
    } catch (error) {
        console.log(error);
    }
}

const postData = async (route, dataToSend) => {
    try {
        const data = await axios.post(route, dataToSend)
    } catch (error) {
        console.log(error.response.data.msg);
    }
}

//fetchData("/data", makeListFromDb_storeToLocal)
//postData("/data",{number:6969})