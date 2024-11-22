const { create } = require("json-server");

const getStreams = async (req, res) => {
    const {db} = req.app;
    try {
        const streams = db.get("streams").value();
        if (streams == null || streams == undefined || streams.length == 0) {
            return res.status(404).send({ message: "No streams found" });
          }
        res.status(200).json(streams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const getStream = async (req, res) => {
    const {db} = req.app;
    const { streamId } = req.params;
    try {
        const stream = db.get("streams").find({id:streamId}).value();
        console.log(stream)
        if (stream == null || stream == undefined) {
            return res.status(404).send({ message: "Stream not found" });
          }
        res.status(200).json(stream);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const createStream = async (req, res) => {
    const { db } = req.app;
    const { title, stream, description, adOne, adTwo, sessionAds, popupAds } = req.body; // Destructure popupAds here
    try {
        if (!title || !stream || !description || !adOne || !adTwo) {
            return res.status(400).json({ error: "Please provide title, stream, description, adOne, and adTwo" });
        }

        
        const trimmedTitle = title.trim().replace(/\s+/g, '-').toLowerCase(); 
        const timestamp = Date.now(); 
        const uniqueId = `${trimmedTitle}-${timestamp}`; 

        // Create new stream object with unique id
        let newStream = {
            id: uniqueId,
            title,
            stream,
            description,
            adOne,
            adTwo,
            createdAt: Date.now(),
        };

        // If sessionAds exist, include them
        if (sessionAds) {
            newStream = { ...newStream, sessionAds };
        }
        // If popupAds exist, include them
        if (popupAds) {
            newStream = { ...newStream, popupAds };
        }

        // Save the new stream in the database
        const savedStream = db.get("streams").push(newStream).write();
        res.status(200).json(savedStream);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const updateStream = (req, res) => {
    try {
        const { db } = req.app;
        const { id } = req.params;
        const { title, stream, description, adOne, adTwo, sessionAds, popupAds } = req.body; // Destructure popupAds here

        if (!title || !stream || !description || !adOne || !adTwo) {
            return res.status(400).json({ error: "Please provide title, stream, description, adOne, and adTwo" });
        }

        // Find the stream to update and assign new values
        const streamToUpdate = db.get("streams")
            .find({ id })
            .assign({
                title,
                stream,
                description,
                adOne,
                adTwo,
                sessionAds, // Include sessionAds if provided
                popupAds, // Include popupAds if provided
                updatedAt: Date.now(),
            })
            .write();

        res.status(200).json(streamToUpdate);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


const deleteStream = (req, res) => {
    try {
        const {db} = req.app;
        const {id} = req.params;
        const streamToDelete = db.get("streams").remove({id}).write();
        res.status(200).json(streamToDelete);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}



const unescapeHtml = (safe) => {
    return safe
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
};

const getHistats = async (req, res) => {
    const { db } = req.app;

    try {
        const histatsEntry = db.get('hitstat').find({ id: 1 }).value();

        if (!histatsEntry || !histatsEntry.content) {
            return res.status(404).json({ error: 'Hitstat content not found' });
        }

        // Unescape the content for rendering
        const unescapedContent = unescapeHtml(histatsEntry.content);

        res.status(200).json({ content: unescapedContent });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};



const escapeHtml = (unsafe) => {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

const saveHistats = async (req, res) => {
    const { db } = req.app;
    const { content } = req.body; // Expecting the Hitstat content (div + script) from the request body

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        // Escape the HTML/script before saving
        const escapedContent = escapeHtml(content);

        // Save or update Hitstat content in the database
        const existingEntry = db.get('hitstat').find({ id: 1 }).value();

        if (existingEntry) {
            // Update the existing entry
            db.get('hitstat').find({ id: 1 }).assign({ content: escapedContent }).write();
        } else {
            // Create a new entry
            db.get('hitstat').push({ id: 1, content: escapedContent }).write();
        }

        res.status(200).json({ message: 'Hitstat content saved successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


  
  



module.exports.StreamController = { getStreams, createStream, updateStream, deleteStream, getStream, getHistats, saveHistats };