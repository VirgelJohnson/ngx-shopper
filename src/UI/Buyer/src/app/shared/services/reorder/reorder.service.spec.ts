import { AppStateService } from '@app-buyer/shared/services/app-state/app-state.service';
import { element } from 'protractor';
import { async, TestBed, inject } from '@angular/core/testing';
import { AppReorderService } from '@app-buyer/shared/services/reorder/reorder.service';
import { OrderReorderResponse } from '@app-buyer/shared/services/reorder/reorder.interface';
import { OcMeService, BuyerProduct, LineItem } from '@ordercloud/angular-sdk';
import { and } from '@angular/router/src/utils/collection';
import { of } from 'rxjs';
import { AppLineItemService } from '@app-buyer/shared/services/line-item/line-item.service';

describe('ReOrder Service', () => {
  const mockLineItems = {
    Items: [{ ProductID: 'someID' }, { ProductID: 'someID2' }],
    Meta: {},
  };
  const mockReOrderResponse = {
    ValidLi: [
      {
        ProductID: 'someID',
        Product: {
          ID: 'someID',
          Inventory: {
            Enabled: false,
            OrderCanExceed: null,
            QuantityAvailable: 100,
          },
          PriceSchedule: {
            RestrictedQuantity: false,
            PriceBreaks: {
              Quantity: 1,
            },
          },
        },
        Quantity: 1,
      },
    ],
    InvalidLi: [{ ProductID: 'someID2' }],
  };
  const mockBuyerProducts = [{ ID: 'someID' }];
  const mockProductIds = ['someID', 'someID2'];
  const mockProductIdsJoin = 'someID|someID2';

  let service;
  let response;
  let appLineItemService = { listAll: () => {} };
  let meService = { ListProducts: () => {} };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [
        AppReorderService,
        { provide: AppLineItemService, useValue: appLineItemService },
        { provide: OcMeService, useValue: meService },
      ],
    });
    service = TestBed.get(AppReorderService);
    appLineItemService = TestBed.get(AppLineItemService);
    meService = TestBed.get(OcMeService);
  }));

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Order', () => {
    beforeEach(() => {
      spyOn(appLineItemService, 'listAll').and.returnValue(of(mockLineItems));
      spyOn(service, 'getValidProducts').and.returnValue(of(mockBuyerProducts));
      spyOn(service, 'isProductInLiValid').and.returnValue(
        of(mockReOrderResponse)
      );
      spyOn(service, 'hasInventory').and.returnValue(of(mockReOrderResponse));
    });

    it('should call appLineItem service with Order ID', () => {
      service.order('orderID');
      expect(service.appLineItemService.listAll).toHaveBeenCalledWith(
        'orderID'
      );
    });

    it('should throw an error if there is no argument Passed', () => {
      expect(() => service.order(null)).toThrow(new Error('Needs Order ID'));
    });

    it('should call getValidProducts', () => {
      service.order('orderID').subscribe();
      expect(service.getValidProducts).toHaveBeenCalledWith(mockProductIds);
    });

    it('should call isProductInLiValid', () => {
      service.order('orderID').subscribe();
      expect(service.isProductInLiValid).toHaveBeenCalledWith(
        mockBuyerProducts,
        mockLineItems.Items
      );
    });

    it('should call hasInventory', () => {
      service.order('orderID').subscribe();
      expect(service.hasInventory).toHaveBeenCalledWith(mockReOrderResponse);
    });
  });

  describe('getValidProducts functionality', () => {
    beforeEach(() => {
      spyOn(meService, 'ListProducts').and.returnValue(of(mockBuyerProducts));
      service['getValidProducts'](mockProductIds);
    });

    it('should call ocMeService ListProducts', () => {
      expect(meService.ListProducts).toHaveBeenCalledWith({
        filters: { ID: mockProductIdsJoin },
      });
    });
  });

  describe('isProductInLiValid functionality', () => {
    beforeEach(() => {
      spyOn(service, 'isProductInLiValid').and.callThrough();
      response = service['isProductInLiValid'](
        mockBuyerProducts,
        mockLineItems.Items
      ).subscribe;
    });

    it('should return orderReorderResponse', () => {
      expect(response).toEqual(of(mockReOrderResponse).subscribe);
    });
  });

  describe('hasInventory functionality', () => {
    beforeEach(() => {
      spyOn(service, 'hasInventory').and.callThrough();
      response = service['hasInventory'](mockReOrderResponse).subscribe;
    });

    it('orderReorderResponse should return one valid li and one invalid li', () => {
      expect(response).toEqual(of(mockReOrderResponse).subscribe);
    });
  });
});