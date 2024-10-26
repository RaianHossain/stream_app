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

        // Create new stream object with unique id
        let newStream = {
            id: crypto.randomUUID({ disableEntropyCache: true }),
            title,
            stream,
            description,
            adOne,
            adTwo,
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
                popupAds // Include popupAds if provided
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

module.exports.StreamController = { getStreams, createStream, updateStream, deleteStream, getStream };