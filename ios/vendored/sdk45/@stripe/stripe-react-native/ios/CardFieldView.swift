import Foundation
import UIKit
import Stripe

class CardFieldView: UIView, STPPaymentCardTextFieldDelegate {
    @objc var onCardChange: ABI45_0_0RCTDirectEventBlock?
    @objc var onFocusChange: ABI45_0_0RCTDirectEventBlock?
    @objc var dangerouslyGetFullCardDetails: Bool = false
    
    private var cardField = STPPaymentCardTextField()
    
    public var cardParams: STPPaymentMethodCardParams? = nil
    public var cardPostalCode: String? = nil

    @objc var postalCodeEnabled: Bool = true {
        didSet {
            cardField.postalCodeEntryEnabled = postalCodeEnabled
        }
    }
    
    @objc var placeholder: NSDictionary = NSDictionary() {
        didSet {
            if let numberPlaceholder = placeholder["number"] as? String {
                cardField.numberPlaceholder = numberPlaceholder
            } else {
                cardField.numberPlaceholder = "1234123412341234"
            }
            if let expirationPlaceholder = placeholder["expiration"] as? String {
                cardField.expirationPlaceholder = expirationPlaceholder
            }
            if let cvcPlaceholder = placeholder["cvc"] as? String {
                cardField.cvcPlaceholder = cvcPlaceholder
            }
            if let postalCodePlaceholder = placeholder["postalCode"] as? String {
                cardField.postalCodePlaceholder = postalCodePlaceholder
            }
        }
    }
    
    @objc var autofocus: Bool = false {
        didSet {
            if autofocus == true {
                cardField.abi45_0_0ReactFocus()
            }
        }
    }
    
    @objc var cardStyle: NSDictionary = NSDictionary() {
        didSet {
            if let borderWidth = cardStyle["borderWidth"] as? Int {
                cardField.borderWidth = CGFloat(borderWidth)
            } else {
                cardField.borderWidth = CGFloat(0)
            }
            if let backgroundColor = cardStyle["backgroundColor"] as? String {
                cardField.backgroundColor = UIColor(hexString: backgroundColor)
            }
            if let borderColor = cardStyle["borderColor"] as? String {
                cardField.borderColor = UIColor(hexString: borderColor)
            }
            if let borderRadius = cardStyle["borderRadius"] as? Int {
                cardField.cornerRadius = CGFloat(borderRadius)
            }
            if let cursorColor = cardStyle["cursorColor"] as? String {
                cardField.cursorColor = UIColor(hexString: cursorColor)
            }
            if let textColor = cardStyle["textColor"] as? String {
                cardField.textColor = UIColor(hexString: textColor)
            }
            if let textErrorColor = cardStyle["textErrorColor"] as? String {
                cardField.textErrorColor = UIColor(hexString: textErrorColor)
            }
            let fontSize = cardStyle["fontSize"] as? Int ?? 14
            
            if let fontFamily = cardStyle["fontFamily"] as? String {
                cardField.font = UIFont(name: fontFamily, size: CGFloat(fontSize)) ?? UIFont.systemFont(ofSize: CGFloat(fontSize))
            } else {
                if let fontSize = cardStyle["fontSize"] as? Int {
                    cardField.font = UIFont.systemFont(ofSize: CGFloat(fontSize))
                }
            }
            if let placeholderColor = cardStyle["placeholderColor"] as? String {
                cardField.placeholderColor = UIColor(hexString: placeholderColor)
            }
        }
    }
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        cardField.delegate = self
        
        self.addSubview(cardField)
    }
    
    func focus() {
        cardField.becomeFirstResponder()
    }
    
    func blur() {
        cardField.resignFirstResponder()
    }
    
    func clear() {
        cardField.clear()
    }
    
    func paymentCardTextFieldDidEndEditing(_ textField: STPPaymentCardTextField) {
        onFocusChange?(["focusedField": NSNull()])
    }
    
    func paymentCardTextFieldDidBeginEditingNumber(_ textField: STPPaymentCardTextField) {
        onFocusChange?(["focusedField": "CardNumber"])
    }
    
    func paymentCardTextFieldDidBeginEditingCVC(_ textField: STPPaymentCardTextField) {
        onFocusChange?(["focusedField": "Cvc"])
    }
    
    func paymentCardTextFieldDidBeginEditingExpiration(_ textField: STPPaymentCardTextField) {
        onFocusChange?(["focusedField": "ExpiryDate"])
    }
    
    func paymentCardTextFieldDidBeginEditingPostalCode(_ textField: STPPaymentCardTextField) {
        onFocusChange?(["focusedField": "PostalCode"])
    }
    
    func paymentCardTextFieldDidChange(_ textField: STPPaymentCardTextField) {
        if onCardChange != nil {
            let brand = STPCardValidator.brand(forNumber: textField.cardParams.number ?? "")
            let validExpiryDate = STPCardValidator.validationState(forExpirationYear: textField.cardParams.expYear?.stringValue ?? "", inMonth: textField.cardParams.expMonth?.stringValue ?? "")
            let validCVC = STPCardValidator.validationState(forCVC: textField.cardParams.cvc ?? "", cardBrand: brand)
            let validNumber = STPCardValidator.validationState(forNumber: textField.cardParams.number ?? "", validatingCardBrand: true)
            var cardData: [String: Any?] = [
                "expiryMonth": textField.cardParams.expMonth ?? NSNull(),
                "expiryYear": textField.cardParams.expYear ?? NSNull(),
                "complete": textField.isValid,
                "brand": Mappers.mapCardBrand(brand) ?? NSNull(),
                "last4": textField.cardParams.last4 ?? "",
                "validExpiryDate": Mappers.mapFromCardValidationState(state: validExpiryDate),
                "validCVC": Mappers.mapFromCardValidationState(state: validCVC),
                "validNumber": Mappers.mapFromCardValidationState(state: validNumber)
            ]
            if (cardField.postalCodeEntryEnabled) {
                cardData["postalCode"] = textField.postalCode ?? ""
            }
            if (dangerouslyGetFullCardDetails) {
                cardData["number"] = textField.cardParams.number ?? ""
            }
            onCardChange!(cardData as [AnyHashable : Any])
        }
        if (textField.isValid) {
            self.cardParams = textField.cardParams
            self.cardPostalCode = textField.postalCode
        } else {
            self.cardParams = nil
            self.cardPostalCode = nil
        }
    }
    
    override func layoutSubviews() {
        cardField.frame = self.bounds
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func paymentContext(_ paymentContext: STPPaymentContext, didFailToLoadWithError error: Error) {
        //
    }
    
    func paymentContextDidChange(_ paymentContext: STPPaymentContext) {
        //
    }
    
    func paymentContext(_ paymentContext: STPPaymentContext, didCreatePaymentResult paymentResult: STPPaymentResult, completion: @escaping STPPaymentStatusBlock) {
        //
    }
    
    func paymentContext(_ paymentContext: STPPaymentContext, didFinishWith status: STPPaymentStatus, error: Error?) {
        //
    }
    
}
