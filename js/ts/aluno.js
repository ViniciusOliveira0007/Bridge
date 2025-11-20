"use strict";
var Escola;
(function (Escola) {
    class Aluno {
        get nome() {
            return this._nome;
        }
        set nome(nome) {
            this._nome = nome;
        }
    }
})(Escola || (Escola = {}));
