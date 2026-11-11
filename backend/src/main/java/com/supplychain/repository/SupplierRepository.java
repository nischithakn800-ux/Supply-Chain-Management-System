
package com.supplychain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.supplychain.entity.Supplier;

public interface SupplierRepository extends JpaRepository<Supplier, Long> {

}
