package com.supplychain.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.supplychain.entity.Inventory;

public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    Optional<Inventory> findByProductId(Long productId);
}
