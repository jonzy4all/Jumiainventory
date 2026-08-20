const PRODUCTS_API = 'https://dummyjson.com/products?limit=100';
const PRODUCT_API = 'https://dummyjson.com/products';
const localInventory = new Map();

async function requestProductApi(url, options = {}) {
	const externalResponse = await fetch(url, {
		...options,
		headers: { 'Content-Type': 'application/json' }
	});

	if (!externalResponse.ok) {
		const error = new Error(`External API returned ${externalResponse.status}`);
		error.statusCode = externalResponse.status;
		throw error;
	}

	return externalResponse.json();
}

async function getInventory(request, response) {
	try {
		const search = (request.query.search || '').toLowerCase();
		const category = (request.query.category || '').toLowerCase();
		const data = await requestProductApi(PRODUCTS_API);
		const productsFromApi = data.products.map((product) => localInventory.get(product.id) || product);
		const products = [...productsFromApi, ...localInventory.values()]
			.filter((product, index, allProducts) => allProducts.findIndex((item) => item.id === product.id) === index)
			.filter((product) => !search || product.title.toLowerCase().includes(search))
			.filter((product) => !category || product.category.toLowerCase() === category)
			.map(({ id, title, category: productCategory, price, stock, rating, thumbnail }) => ({
				id,
				title,
				category: productCategory,
				price,
				stock,
				rating,
				thumbnail
			}));

		return response.json({ count: products.length, products });
	} catch (error) {
		console.error('GET /inventory failed:', error.message);
		return response.status(502).json({ error: 'Unable to load inventory from the external API.' });
	}
}

async function getInventoryById(request, response) {
	try {
		const id = Number(request.params.id);
		if (localInventory.has(id)) {
			return response.json(localInventory.get(id));
		}

		const product = await requestProductApi(`${PRODUCT_API}/${request.params.id}`);
		return response.json(product);
	} catch (error) {
		const statusCode = error.statusCode === 404 ? 404 : 502;
		return response.status(statusCode).json({ error: statusCode === 404 ? 'Inventory item not found.' : 'Unable to load inventory item.' });
	}
}

async function createInventory(request, response) {
	const { title, price, stock, category } = request.body;

	if (!title || price === undefined || stock === undefined || !category) {
		return response.status(400).json({ error: 'title, price, stock, and category are required.' });
	}

	try {
		const product = await requestProductApi(`${PRODUCT_API}/add`, {
			method: 'POST',
			body: JSON.stringify({ title, price, stock, category })
		});
		localInventory.set(product.id, product);
		return response.status(201).json(product);
	} catch (error) {
		return response.status(502).json({ error: 'Unable to create inventory item.' });
	}
}

async function updateInventory(request, response) {
	const { title, price, stock, category } = request.body;
	const changes = Object.fromEntries(
		Object.entries({ title, price, stock, category }).filter(([, value]) => value !== undefined)
	);

	if (Object.keys(changes).length === 0) {
		return response.status(400).json({ error: 'Send at least one field to update.' });
	}

	try {
		const id = Number(request.params.id);
		if (localInventory.has(id)) {
			const updatedProduct = { ...localInventory.get(id), ...changes };
			localInventory.set(id, updatedProduct);
			return response.json(updatedProduct);
		}

		const product = await requestProductApi(`${PRODUCT_API}/${request.params.id}`, {
			method: 'PUT',
			body: JSON.stringify(changes)
		});
		localInventory.set(product.id, product);
		return response.json(product);
	} catch (error) {
		const statusCode = error.statusCode === 404 ? 404 : 502;
		return response.status(statusCode).json({ error: statusCode === 404 ? 'Inventory item not found.' : 'Unable to update inventory item.' });
	}
}

module.exports = { getInventory, getInventoryById, createInventory, updateInventory };