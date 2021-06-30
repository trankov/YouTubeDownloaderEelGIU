// basic controls
const btnSubmit = document.getElementById("btnSubmit");
const txtYTurl = document.getElementById("txtTYurl");
const lblSpaceholder = document.getElementById("lblSpaceholder");

// preloader
const bars3 = document.getElementById("bars3");

// video information
const imgpreview = document.getElementById("imgpreview");
const videodescription = document.getElementById("videodescription");
const channelname = document.getElementById("channelname");
const channelurl = document.getElementById("channelurl");
const videotitle = document.getElementById("videotitle");
const videourl = document.getElementById("videourl");
const videosummary = document.getElementById("videosummary");
const videotags = document.getElementById("videotags");

// progress bar
const progressbar = document.getElementById("progressbar");
const progressvalue = document.getElementById("progressvalue");

// video tracks
const trackspace = document.getElementById("trackspace");
const tracks = document.getElementById("tracks");


eel.expose(show_progress_js); // Get data from Python and draw progress bar
function show_progress_js(filesize) {
    let current = 100-Math.round((filesize / progressbar.getAttribute("max")) * 100);
    progressvalue.style.width = current + "%";
    progressvalue.innerText = current + '%';
}


eel.expose(show_complete_js); // When Download complete
function show_complete_js(filepath) {
    progressbar.style.display = "none";
    trackspace.style.visibility = "visible";
    btnSubmit.style.visibility = "visible";
    console.log(filepath);
}


eel.expose(setsize_js); // Set file size as attribute (sort of global variable)
function setsize_js(filesize) {
    progressbar.setAttribute("max", filesize);
    progressbar.style.display = "block";
    console.log('file size = ' + filesize);
}


// Ask Python for JSON with Video info
async function get_content(url) {
    let content = await eel.py_get_datas(url)();
    return content;
}


// Show folder dialog from Python and get the result
async function get_path() {
    let path = await eel.py_getpath()();
    return path;
}


// Onclick handler, send download data to Python
async function track_download(event) {
    let url = txtTYurl.value;
    let path = await get_path();
    let itag = event.target.getAttribute("itag");
    trackspace.style.visibility = "hidden";
    btnSubmit.style.visibility = "hidden";
    await eel.py_download_track(url, itag, path);
    event.target.style.display = "none";
}


// Event handler for [Get info] button
btnSubmit.addEventListener("click", async () => {
    let url = txtTYurl.value;
    if (!url) {
        return false;
    }

    lblSpaceholder.style.display = "none";
    trackspace.style.visibility = "hidden";
    bars3.style.display = "block";
    btnSubmit.style.visibility = "hidden";
    clearDynamics();

    let content = await get_content(url);

    bars3.style.display = "none";
    lblSpaceholder.style.display = "block";
    trackspace.style.visibility = "visible";

    if (content == "ERROR") {
        txtTYurl.value = 'Wrong URL, please check it.';
    }
    else {
        fillSpaceholder(content);
    }

    btnSubmit.style.visibility = "visible";
});


// Draw interface with video info
function fillSpaceholder(content) {
    const info = JSON.parse(content);

    imgpreview.src = info["thumbnail_url"];

    videotitle.innerText = info["title"];
    videourl.href = info["embed_url"];

    channelname.innerText = info["author"];
    channelurl.href = info["channel_url"];

    videosummary.innerText = info["description"].replace("\\n", "<br>");
    videotags.append(fillKeywords(info["keywords"]));

    tracks.append(fillTracks(info["tracks"]));
}


// Wrap keywords list in <span>s
function fillKeywords(data) {
    const kwelement = new DocumentFragment();
    for (let keyword in data) {
        let kwrd = document.createElement("span");
        kwrd.className = "keyword";
        kwrd.append(data[keyword]);
        kwelement.append(kwrd);
    }
    return kwelement;
}


// Draw table with tracks and download buttons with handlers
function fillTracks(data) {
    const tracks = new DocumentFragment();
    for (let i in data) {
        let track = data[i];
        let tr = document.createElement("tr");
        for (let j in track) {

            let td = document.createElement("td");
            td.className = j;
            let inside = track[j] == null ? " " :
                Array.isArray(track[j]) ?
                    track[j].length > 1  ? "Progressive" : "Adaptive"
                : track[j];
            td.className += ' ' + inside;

            if (j == 'bitrate') {
                inside = inside.toLocaleString("ru-RU");
            }

            td.append(inside);
            tr.append(td);
        }
        let tdbutton = document.createElement("td");
        tdbutton.className = "tdbutton";

        let btnDownload = document.createElement("input");
        btnDownload.className = "btndownload";
        btnDownload.setAttribute("itag", track["itag"]);
        btnDownload.setAttribute("value", "Download");
        btnDownload.setAttribute("type", "button");
        btnDownload.setAttribute("id", "track" + track["itag"]);
        btnDownload.addEventListener("click", track_download);

        tdbutton.append(btnDownload);
        tr.append(tdbutton);

        tracks.append(tr);
    }
    return tracks;
}


// Dynamically created content should be removed manually
function clearDynamics() {
    while (videotags.lastChild) {
        videotags.removeChild(videotags.lastChild);
    }

    let tracks = document.querySelectorAll("#tracks > tr");
    tracks.forEach((e) => e.parentNode.removeChild(e));
    // forEach(el => el.remove())
    //Array.from(document.querySelectorAll('.someselector')).forEach(el => el.remove());
}
