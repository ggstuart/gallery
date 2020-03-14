"use strict";

async function getData(url) {
  const response = await fetch(url);
  return response.json();
}

async function getObject(id) {
  const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;
  const result = await getData(url)
  return result;
}

async function getSearch(query) {
  const key = `metmuseum?q=${query}`;
  const stored = localStorage.getItem(key);
  if(stored) return JSON.parse(stored);
  const url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${query}`;
  const result = await getData(url)
  localStorage.setItem(key, JSON.stringify(result));
  return result;
}

async function requestObjects(ids) {
  console.log(ids.slice(0, 3));
  return ids.slice(0, 3).map(requestObject);
}

function buildNode(object) {
  const article = document.createElement('article');
  const figure = document.createElement('figure');
  const caption = document.createElement('figcaption');
  figure.appendChild(caption);
  figure.style.backgroundImage = `url('${object.primaryImageSmall}')`
  article.appendChild(figure);
  caption.textContent = object.title;
  article.myData = object;
  article.addEventListener('click', ev => {
    article.classList.toggle('modal');
    const imageLarge = document.createElement('img');
    imageLarge.src = object.primaryImage;
    imageLarge.addEventListener('load', ev => {
      figure.style.backgroundImage = `url('${object.primaryImage}')`;
      // imageLarge.remove();
    })
  });
  return article;
}

function doSearch(query) {
  // clear any errorMessages
  const error = document.querySelector('#errorMessage');
  if(error) error.remove();

  getSearch(query).then(search => {
    // check we got some results
    if (!search['objectIDs']) throw `No results found for "${query}", try again.`

    // clear any old results
    while(gallery.firstChild) {
      gallery.removeChild(gallery.firstChild);
    }

    // show how many results were found
    while(pagination.firstChild) {
      pagination.removeChild(pagination.firstChild);
    }
    const message = document.createElement('div');
    message.textContent = `Found ${search['objectIDs'].length} results for "${query}"`;
    pagination.appendChild(message)

    // Just select nine for now
    const myObjects = search['objectIDs'].slice(0, 6);

    // Load individual object data and insert into DOM
    // this waits for them all to load before building the first article
    // It might be better to build the first articles as soon as the data are availble
    // because one might stall for ages
    Promise.all(myObjects.map(getObject)).then(result => {
      const nodes = result.map(buildNode);
      nodes.forEach(node => gallery.appendChild(node));
    });
  }).catch(error => {
    const errorMessage = document.createElement('section');
    errorMessage.textContent = error;
    errorMessage.classList.add('error');
    errorMessage.setAttribute('id', 'errorMessage');
    main.insertBefore(errorMessage, gallery);
  });
}

searchBtn.addEventListener('click', ev => {
  if(search.value) {
    doSearch(search.value)
    search.value = null;
  }
});
