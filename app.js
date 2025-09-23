const form = document.getElementById('searchForm');
const recommendFilterForm = document.getElementById('recommendFilterForm');

form.addEventListener('submit', async function (e){
  e.preventDefault();
  document.getElementById('results').innerHTML = '';
  const query = document.getElementById('searchInput').value;
  const config = {params: {q: query}};
  const response = await axios.get('https://api.tvmaze.com/search/shows', config);
  makeShowCard(response.data);
  document.getElementById('searchInput').value = '';
})

recommendFilterForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  document.getElementById('results').innerHTML = '';
  const genre = document.getElementById('genreSelect').value;
  const year = document.getElementById('yearInput').value;
  const config = { params: { genre, year } };
  const response = await axios.get('https://api.tvmaze.com/shows', config);
  console.log(response.data)
  makeShowCard(response.data);
  document.getElementById('yearInput').value = '';
});

const makeShowCard = (shows) => {
  for (let result of shows) {
    if (result.show.image) {
      const imgSrc = result.show.image.medium;
      const card = document.createElement('div');
      card.classList.add('card');
      card.style.display = 'inline-block';
      card.style.width = '210px';
      card.style.margin = '1rem';
      card.innerHTML = `<img src="${imgSrc}" alt="${result.show.name}"><h3>${result.show.name}</h3>`;
      document.getElementById('results').appendChild(card);
    }
    else {
      const card = document.createElement('div');
      card.classList.add('card');
      card.style.display = 'inline-block';
      card.style.width = '210px';
      card.style.margin = '1rem';
      card.innerHTML = `<img src="https://placehold.co/210x295" alt="${result.show.name}"><h3>${result.show.name}</h3>`;
      document.getElementById('results').appendChild(card);
    }
  }
}