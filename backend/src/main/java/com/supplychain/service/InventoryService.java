package com.supplychain.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.supplychain.entity.Inventory;
import com.supplychain.entity.Product;
import com.supplychain.repository.InventoryRepository;
import com.supplychain.repository.ProductRepository;

@Service
public class InventoryService {
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;

    public InventoryService(InventoryRepository inventoryRepository, ProductRepository productRepository) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public Inventory addInventory(Inventory inventory) {
        validate(inventory);
        Product product = findProduct(inventory.getProductId());
        if (inventoryRepository.findByProductId(inventory.getProductId()).isPresent()) {
            throw new IllegalArgumentException("An inventory record already exists for this product. Update the existing record instead.");
        }
        product.setQuantity(inventory.getStockQuantity());
        productRepository.save(product);
        return inventoryRepository.save(inventory);
    }

    public List<Inventory> getAllInventory() {
        List<Inventory> items = inventoryRepository.findAll();
        // Product quantity is the stock source of truth because customer orders update it.
        items.forEach(item -> productRepository.findById(item.getProductId()).ifPresent(
            product -> item.setStockQuantity(product.getQuantity())));
        return items;
    }

    public Inventory getInventoryById(Long id) {
        Inventory item = inventoryRepository.findById(id).orElse(null);
        if (item != null) {
            productRepository.findById(item.getProductId()).ifPresent(p -> item.setStockQuantity(p.getQuantity()));
        }
        return item;
    }

    @Transactional
    public Inventory updateInventory(Long id, Inventory inventory) {
        validate(inventory);
        Inventory existing = inventoryRepository.findById(id).orElse(null);
        if (existing == null) return null;
        if (!existing.getProductId().equals(inventory.getProductId())) {
            throw new IllegalArgumentException("An inventory record cannot be reassigned to another product.");
        }
        Product product = findProduct(existing.getProductId());
        product.setQuantity(inventory.getStockQuantity());
        productRepository.save(product);
        existing.setStockQuantity(inventory.getStockQuantity());
        existing.setReorderLevel(inventory.getReorderLevel());
        return inventoryRepository.save(existing);
    }

    public boolean deleteInventory(Long id) {
        if (!inventoryRepository.existsById(id)) return false;
        inventoryRepository.deleteById(id);
        return true;
    }

    public List<Inventory> getLowStockItems() {
        return getAllInventory().stream()
            .filter(item -> item.getStockQuantity() <= item.getReorderLevel()).toList();
    }

    private void validate(Inventory inventory) {
        if (inventory.getProductId() == null) throw new IllegalArgumentException("Product ID is required.");
        if (inventory.getStockQuantity() < 0) throw new IllegalArgumentException("Stock quantity cannot be negative.");
        if (inventory.getReorderLevel() < 0) throw new IllegalArgumentException("Reorder level cannot be negative.");
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id).orElseThrow(
            () -> new IllegalArgumentException("Product not found with ID: " + id));
    }
}
