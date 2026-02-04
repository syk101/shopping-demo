const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: body ? JSON.parse(body) : null
                    });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function runTest() {
    console.log('Starting verification...');

    // 1. Create Product
    console.log('1. Creating Product...');
    const productData = {
        name: 'Test Verify Product',
        price: 50.00,
        stock_quantity: 100,
        category: 'Test',
        description: 'Auto test product'
    };

    const createRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/products',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, productData);

    if (createRes.status !== 201) {
        console.error('Failed to create product:', createRes);
        process.exit(1);
    }
    const product = createRes.data;
    console.log('   Product created:', product.id, 'Stock:', product.stock_quantity);

    // 2. Check Inventory Initial (Should be 100)
    console.log('2. Checking Inventory...');
    // We need to find the inventory item for this product. 
    // The API /api/inventory returns all, let's filter or get by ID if we knew it.
    // But listing all is easier for this script.
    const invRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/inventory',
        method: 'GET'
    });

    const inventoryItem = invRes.data.find(i => i.product_id === product.id);
    if (!inventoryItem) {
        console.error('Inventory item not found for product');
        process.exit(1);
    }
    console.log('   Inventory item found:', inventoryItem.id, 'Stock:', inventoryItem.stock_quantity);

    if (inventoryItem.stock_quantity !== 100) {
        console.error('Mismatch! Expected 100');
        process.exit(1);
    }

    // 3. Update Inventory (Set to 50)
    console.log('3. Updating Inventory to 50...');
    const updateInvRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/inventory/${inventoryItem.id}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
    }, { stock_quantity: 50 });

    if (updateInvRes.status !== 200) {
        console.error('Failed to update inventory:', updateInvRes);
        process.exit(1);
    }
    console.log('   Inventory updated.');

    // 4. Check Product Stock (Should be 50 now - SYNC CHECK)
    console.log('4. Checking Product Stock Sync...');
    const productRecheck = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/products/${product.id}`,
        method: 'GET'
    });

    console.log('   Product Stock:', productRecheck.data.stock_quantity);
    if (productRecheck.data.stock_quantity !== 50) {
        console.error('SYNC FAILED! Product stock should be 50.');
        process.exit(1);
    }

    // 5. Create Order (Qty 10)
    console.log('5. Creating Order for 10 items...');
    const orderData = {
        customer_name: 'Test Bot',
        customer_email: 'bot@test.com',
        product_id: product.id,
        quantity: 10,
        total_amount: 500,
        status: 'pending'
    };

    const orderRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    }, orderData);

    if (orderRes.status !== 201) {
        console.error('Failed to create order:', orderRes);
        process.exit(1);
    }
    console.log('   Order created.');

    // 6. Check Inventory Final (Should be 40)
    console.log('6. Checking Final Inventory...');
    const finalInvRes = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/inventory/${inventoryItem.id}`,
        method: 'GET'
    });

    console.log('   Final Inventory Stock:', finalInvRes.data.stock_quantity);
    if (finalInvRes.data.stock_quantity !== 40) {
        console.error('ORDER SYNC FAILED! Inventory should be 40.');
        process.exit(1);
    }

    console.log('SUCCESS: All checks passed!');
}

runTest();
