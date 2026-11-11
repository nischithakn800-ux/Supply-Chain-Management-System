
package com.supplychain.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.supplychain.entity.Supplier;
import com.supplychain.repository.SupplierRepository;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public Supplier addSupplier(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    public Supplier getSupplierById(Long id) {
        return supplierRepository.findById(id).orElse(null);
    }

    public Supplier updateSupplier(Long id, Supplier supplier) {
        Supplier existingSupplier =
                supplierRepository.findById(id).orElse(null);

        if (existingSupplier == null) {
            return null;
        }

        existingSupplier.setName(supplier.getName());
        existingSupplier.setEmail(supplier.getEmail());
        existingSupplier.setPhone(supplier.getPhone());
        existingSupplier.setAddress(supplier.getAddress());

        return supplierRepository.save(existingSupplier);
    }

    public boolean deleteSupplier(Long id) {
        if (!supplierRepository.existsById(id)) {
            return false;
        }

        supplierRepository.deleteById(id);
        return true;
    }
}
