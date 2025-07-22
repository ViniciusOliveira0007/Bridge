namespace escola{
    export class Pessoa{
        private _nome:string;
        private _email:string;


        constructor(nome:string,email:string){
            this._nome=nome
            this._email=email
        }


        get nome(){
            return this._nome;
        }

    }
}