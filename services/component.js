/*
 * Product    : AQUILA-CMS
 * Author     : Nextsourcia - contact@aquila-cms.com
 * Copyright  : 2021 © Nextsourcia - All rights reserved.
 * License    : Open Software License (OSL 3.0) - https://opensource.org/licenses/OSL-3.0
 * Disclaimer : Do not edit or add to this file if you wish to upgrade AQUILA CMS to newer versions in the future.
 */

const NSErrors = require('../utils/errors/NSErrors');

/**
 * get component
 * @param {string} componentName always starts with "ns-"
 * @param {string} code
 * @param {string} [authorization]
 */
const getComponent = async (componentName, code, user = null) => {
    if (code === null) throw NSErrors.ComponentCodeNotFound;
    // Le component doit commencer par ns- sinon ce composant n'est pas valide
    if (!componentName.startsWith('ns-')) throw NSErrors.ComponentNotAllowed;
    // On passe de ns-slider a slider on pourra ainsi facilement recupérer son modéle et son service
    componentName = componentName.replace('ns-', '');

    let models;
    let PostBody;
    switch (componentName) {
    case 'megamenu':
    case 'menu':
        models                  = require('../orm/models/categories');// categories/roots
        const categorieServices = require('./categories');// categories/roots
        const X                 = await categorieServices.getCategoryChild(code, {active: true, isDisplayed: true}, user);
        return X;
    case 'cms':
        models                 = require('../orm/models/cmsBlocks');
        const cmsBlockServices = require('./cmsBlocks');
        PostBody               = {filter: {code}, structure: {content: 1, translation: 1}};
        const result           = await cmsBlockServices.getCMSBlock(PostBody);
        if ((user && !user.isAdmin) && result && result.translation) {
            // on boucle sur les langues contenue
            for (let k = 0; k < Object.keys(result.translation).length; k++) {
                const langKey = Object.keys(result.translation)[k];
                delete result.translation[langKey].variables;
                delete result.translation[langKey].html;
            }
        }
        return result;
    case 'gallery':
        models               = require(`../orm/models/${componentName}`);
        const ServiceGallery = require(`./${componentName}`);
        return ServiceGallery.getItemsGallery(code);
    case 'agenda':
        models              = require(`../orm/models/${componentName}`);
        const ServiceAgenda = require(`./${componentName}`);
        return ServiceAgenda.getAgendaByCode(code);
    default:
        /**
         * On cherchera le composant en fonction du "code"
         * on crée donc une requete queryBuilder ici afin de ne pas avoir a la recréer coté client a chaque fois
         */
        PostBody = {filter: {code}};
        // On récupére le models en fonction du componentName
        models = require(`../orm/models/${componentName}`);
        if (!models) throw NSErrors.ComponentInvalidModel;
        // On recupére le service en fonction du componentName
        const genericServices = require(`./${componentName}`);
        // Exemple : slider deviendra Slider afin d'appeler la fonction getSlider
        const funcName = componentName.charAt(0).toUpperCase() + componentName.slice(1);
        return genericServices[`get${funcName}`](PostBody);
    }
};

module.exports = {
    getComponent
};