import React, { MouseEventHandler, useEffect, useLayoutEffect,useRef, useState } from 'react';
import './App.css';




/**
 * // [min,max]
 * @param {number} min - beginning of the range of numbers
 * @param {number} max - end of the range of numbers
 * @returns whole number
 */
const getRandNum = (min: number, max: number): number  => {
  return Math.round((Math.random() * (max - min) + min));
}

const getRandArr = (min:number,max:number, size:number):number[] => {
  return Array.from(Array(size),()=>getRandNum(min,max))
}



interface Operator  {
  ADD: number,
  SUB: number,
  DIV: number,
  MULT: number,
  PAR: number,
}
type Partial<T> = {
  [I in keyof T]?: T[I];
}

type LogEntry = {
  operand1:number,
  operand2:number,
  index:number[],
  operation:number ,
  operands:number[],
}


function App() {
  const [operands, setOperands] = useState<number[]>([]);
  const prevIndex = useRef<number>(-1);
  const curOperator = useRef<number|null>(null);
  const [total, setTotal] = useState<number>();
  const [log,setLog] = useState<LogEntry[]>([])

  const OPERATOR:Operator = {
    ADD: 1,
    SUB: 2,
    DIV: 3,
    MULT: 4,
    PAR: 5,
  }
  const [difficulty,setDifficulty] = useState<number>(10);
  const MIN = 1;




  const performOperation = (total:number, num:number, operator:number) => {
    if(operator === 1) total += num;
    else if(operator === 2){
      total -= num;
    } 
    else if(operator === 3) {
      total /= num;
    }
    else if(operator === 4) total *= num;
    return total;
  }
  const validateOperation = (total:number, num:number, operator:number, arr:number[]): [number, number] => {
    while( !!arr.find((val)=>val===num ) || (((operator === 2) && ((total - num) < 0)) || ((operator === 3) && ((total % num) !== 0)))){
      num = getRandNum(MIN,difficulty);
      operator = getRandNum(MIN,4);
    }
    return [num,operator]
  }

  const isValidOperation = (total:number, num:number, operator:number,arr:number[]):boolean => {
    return  ((operator === 1) ||(operator === 2) && ((total - num) >= 0)) || ((operator === 3) && ((total % num) === 0) || (operator === 4))
  }



  const setUp = () => {

    const undoneElement = document.querySelector<HTMLSpanElement>("#undoneOp")
    if(undoneElement !== null) undoneElement.innerText = ``; 

    let arr:number[] = [];
    let total:number = 0;
    for(let i = 0; i < 4; i++){
      let num:number = getRandNum(MIN,difficulty);
      let operator = getRandNum(MIN,i===3 ? 4 : 5);
      if(operator === 5){
        console.log("op idx: ",i)
        while(true){
          if(!i) total = num;
          let subtotal = 0;
          let outerOperator = getRandNum(MIN,4);
          let innerOperator = getRandNum(MIN,4);
          let nextNum = getRandNum(MIN,difficulty);
          while( arr.includes(num) || num === nextNum || !isValidOperation(num,nextNum,innerOperator,arr)){
            num = getRandNum(MIN, difficulty);
            [nextNum,innerOperator] = validateOperation(num,nextNum,innerOperator,arr);
          }
          subtotal = performOperation(num,nextNum,innerOperator)
          if(isValidOperation(total,subtotal,outerOperator,arr)) {
            arr.push(num,nextNum);
            total = performOperation(total,subtotal,outerOperator);
            break;
          }
        }
        i++;
        continue;
      }
      if(!i){
        arr.push(num);
        total = num;
        continue;
      }

      [num,operator] = validateOperation(total,num,operator,arr);
      total = performOperation(total,num,operator);
      arr.push(num);
    }
    console.log(`arr: `,arr)
    setLog([])
    setTotal(total);
    setOperands(arr.sort((a:number,b:number) => a-b));
  }

  const clearBoard = () => {
    document.querySelector<HTMLButtonElement>(".operands")?.setAttribute("data-result","correct");
      setTimeout(()=>{
        document.querySelector<HTMLButtonElement>(".operands")?.setAttribute("data-result","");
        document.querySelectorAll<HTMLButtonElement>(".selected").forEach((el:HTMLButtonElement)=>{
          el.classList.remove("selected");
        })
        document.querySelectorAll<HTMLButtonElement>(".operators button").forEach((el:HTMLButtonElement)=>{
          el.setAttribute("data-disabled","true");
        })
        setTimeout(()=>{
          curOperator.current = null
          prevIndex.current = -1;
        })
      })
  }

  useLayoutEffect(() => {
    clearBoard()
    setUp();
   
  }, [difficulty])

  const selectOperator = (op:number,el:React.MouseEvent<HTMLButtonElement,MouseEvent>) => {
    if(prevIndex.current === -1 || operands.length === 1) return;
    document.querySelector(".operators .selected")?.classList.remove("selected");
    if(curOperator.current === op) {
      curOperator.current = null;
      el.currentTarget.classList.remove("selected");
    }
    else{
      curOperator.current = op; 
      el.currentTarget.classList.add("selected");
    } 
  }

  const getResult = (index:number,el:React.MouseEvent<HTMLButtonElement,MouseEvent>) => {
    if(operands.length === 1) return;
    if(curOperator.current && index === prevIndex.current){
      return;
    }
    else if(index === prevIndex.current){
      el.currentTarget.classList.remove("selected");
    }
    else if(curOperator.current){
      el.currentTarget.classList.add("selected");
      setLog(prev=>{
        let obj:LogEntry = {
          operand1:operands[prevIndex.current],
          operand2:operands[index],
          index:[prevIndex.current,index],
          operation:curOperator.current!,
          operands:operands,
        }
        return [...prev,obj]
      })
      setOperands((prev)=>{
        let result:number = performOperation(prev[prevIndex.current],prev[index],curOperator.current!)
        let newArr = prev.filter((_,idx:number)=>{
          return ![prevIndex.current,index].includes(idx);
        })
        if(newArr.length === 0 && result === total) {
          console.log("correct");
          document.querySelector<HTMLButtonElement>(".operands")?.setAttribute("data-result","correct");
          setTimeout(()=>{
            clearBoard();
            setUp();
          },1000)
        }
        else if(newArr.length === 0 && result !== total) {
          console.log("incorrect");
          document.querySelector<HTMLButtonElement>(".operands")?.setAttribute("data-result","incorrect");
        }
        return [...newArr,result]
      })
      document.querySelectorAll<HTMLButtonElement>(".selected").forEach((el:HTMLButtonElement)=>{
        el.classList.remove("selected");
      })
    }
    else{
      document.querySelector<HTMLButtonElement>(".selected")?.classList.remove("selected");
      el.currentTarget.classList.add("selected");
      document.querySelectorAll<HTMLButtonElement>(".operators button").forEach((el:HTMLButtonElement)=>{
        el.setAttribute("data-disabled","false");
      })
      prevIndex.current = index
      return;
    }
    document.querySelectorAll<HTMLButtonElement>(".operators button").forEach((el:HTMLButtonElement)=>{
      el.setAttribute("data-disabled","true");
    })
    setTimeout(()=>{
      curOperator.current = null
      prevIndex.current = -1;
    })
   
  }

  const changeDifficulty = (degree:number) => {
    setDifficulty(degree)
  }

  const undo = () => {
    const operators = ["+","-","÷","•"]
    setLog((prev:LogEntry[])=>{
      if(prev.length){
        const lastLog:LogEntry = prev.pop()!;
        const undoneElement = document.querySelector<HTMLSpanElement>("#undoneOp")
        if(undoneElement !== null) undoneElement.innerText = `${lastLog.operand1} ${operators[lastLog.operation-1]} ${lastLog.operand2}`; 
        setOperands(lastLog.operands)
      }
      return prev
    })
    if(operands.length === 1){
      document.querySelector<HTMLButtonElement>(".operands")?.setAttribute("data-result","");
      console.log("single")
    }
    if(operands.length !== 4){
      clearBoard();
    }
  }


  return (
    <div className="App">
      <h1>Make A Number</h1>
      <div className="difficultySetting">
        <button style={(difficulty===10 ? {opacity:0.6} : {})} onClick={()=>changeDifficulty(10)}>Easy</button>
        <button style={(difficulty===20 ? {opacity:0.6} : {})} onClick={()=>changeDifficulty(20)}>Intermediate</button>
        <button style={(difficulty===50 ? {opacity:0.6} : {})} onClick={()=>changeDifficulty(50)}>Hard</button>
      </div>
      <div className="operators">
        <button data-disabled={"true"} onClick={(el)=>{selectOperator(OPERATOR.ADD,el)}}>+</button>
        <button data-disabled={"true"} onClick={(el)=>{selectOperator(OPERATOR.SUB,el)}}>-</button>
        <button data-disabled={"true"} onClick={(el)=>{selectOperator(OPERATOR.DIV,el)}}>÷</button>
        <button data-disabled={"true"} onClick={(el)=>{selectOperator(OPERATOR.MULT,el)}}>•</button>
      </div>
      <button onClick={undo}>undo</button>
      <p >Undone: <span id="undoneOp"></span></p>
        <div>Target: {total}</div>
      <div className="mainContent">
        <button id="refresh" onClick={setUp}>Refresh</button>
        {
          operands.map((val:number,idx:number)=>{
            return(
                <button key={idx}  className="operands" onClick={(el)=>{ getResult(idx,el)}}><span>{val}</span></button>
            )
          })
        }

      </div>


    </div>
  )
}

export default App
