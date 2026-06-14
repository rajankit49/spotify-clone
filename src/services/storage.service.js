const { ImageKit } = require("@imagekit/nodejs");

const ImageKitClient = new ImageKit({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
})

async function uploadFile(file, originalName){
    const ext = originalName ? originalName.substring(originalName.lastIndexOf('.')) : '.mp3';
    const result = await ImageKitClient.files.upload({
        file,
        fileName: "music_" + Date.now() + ext,
        folder: "yt-compltete-backend/music"
    })
    return result;
}

module.exports = { uploadFile }

