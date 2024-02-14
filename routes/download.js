const express = require('express');
// const fetch = require('node-fetch');

const router = express.Router();

const validateParams = (req, res, next) => {
    const { folder, name } = req.params;

    if (!folder || !name) {
        return res.status(400).json({
            message: 'Both folder and name parameters are required'
        });
    }

    next();
};


router.get('/:folder/:name', validateParams, async (req, res) => {
    const { folder, name } = req.params;
    const download_link = `https://download.kiwix.org/zim/${folder}/${name}.zim`;

    try {
        const response = await fetch(download_link);

        if (response.status === 404) {
            return res.status(404).json({
                message: 'The requested file was not found'
            });
        }

        return res.redirect(response.url);
    } catch (error) {
        console.error('Error fetching download link.', error);
        return res.status(500).json({
            message: 'Internal server error occurred while processing the request'
        });
    }
});

module.exports = router;
