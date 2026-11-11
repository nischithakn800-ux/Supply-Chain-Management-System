
package com.supplychain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.supplychain.entity.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {

}
