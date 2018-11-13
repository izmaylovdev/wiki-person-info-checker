import ICheckResults from '../models/check-results.model';
import IFamilyMember from '../models/family-member.model';

export default function skipResults(cb: Function) {
    return function (data: ICheckResults | IFamilyMember) {
        if ('status' in data) {
            return data;
        } else {
            return cb(data);
        }
    };
}
