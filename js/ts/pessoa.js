"use strict";
var escola;
(function (escola) {
    class Pessoa {
        constructor(nome, email) {
            this._nome = nome;
            this._email = email;
        }
        get nome() {
            return this._nome;
        }
    }
    escola.Pessoa = Pessoa;
})(escola || (escola = {}));
