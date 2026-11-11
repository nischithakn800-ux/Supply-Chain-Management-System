package com.supplychain.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.supplychain.entity.CustomerOrder;

public interface CustomerOrderRepository
        extends JpaRepository<CustomerOrder, Long> {

    List<CustomerOrder> findByCustomer_Id(Long customerId);

    List<CustomerOrder> findByCustomer_Email(String email);
}